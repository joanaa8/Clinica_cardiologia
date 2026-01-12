from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

# Configuração da BD (A mesma do teu importer)
DB_CONFIG = {
    "dbname": "cdss_db", 
    "user": "postgres",
    "password": "ipcAKuKa1214", # <--- ATUALIZA AQUI
    "host": "localhost",
    "port": "5432"
}

class CalculationRequest(BaseModel):
    med_name: str
    weight: float
    age: int

@app.post("/calculate")
def calculate_dosage(data: CalculationRequest):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Definir População
        populacao = 'adultos'
        if data.age < 18: populacao = 'pediatrico'
        elif data.age >= 65: populacao = 'idosos'

        # 2. Buscar Regra
        query = """
            SELECT r.*, m.nome_comercial 
            FROM cdss.posologia_regras r
            JOIN cdss.medicamentos m ON r.medicamento_id = m.id
            WHERE m.nome_comercial ILIKE %s 
            AND (r.faixa_etaria = %s OR r.faixa_etaria = 'intro_geral')
            ORDER BY r.pontuacao_confianca DESC
            LIMIT 1
        """
        cur.execute(query, (f"%{data.med_name}%", populacao))
        regra = cur.fetchone()
        
        conn.close()

        if not regra:
            return {"found": False, "message": "Regra não encontrada."}

        # 3. Calcular
        calculo = None
        alertas = []

        # Lógica Pediátrica
        if populacao == 'pediatrico' and regra['dose_por_kg_valor_min']:
            dose_min = float(regra['dose_por_kg_valor_min']) * data.weight
            dose_max = float(regra['dose_por_kg_valor_max'] or regra['dose_por_kg_valor_min']) * data.weight
            
            calculo = {
                "tipo": "Pediátrico (Peso)",
                "dose_diaria": f"{dose_min:.2f} - {dose_max:.2f} {regra['dose_por_kg_unidade']}",
                "detalhe": f"{regra['dose_por_kg_valor_min']} x {data.weight}kg"
            }
        
        # Lógica Standard
        elif regra['dose_usual_valor_min']:
            calculo = {
                "tipo": "Standard",
                "dose_diaria": f"{regra['dose_usual_valor_min']} {regra['dose_usual_unidade']}",
                "detalhe": "Dose usual"
            }

        return {
            "found": True,
            "calculo": calculo,
            "alertas": alerts_check(regra, calculo),
            "nota_clinica": regra.get('texto_revisao')
        }

    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor de cálculo")

def alerts_check(regra, calculo):
    alerts = []
    if regra.get('dose_maxima_valor') and calculo:
        # Aqui podias adicionar lógica matemática de comparação
        alerts.append(f"Teto Máximo: {regra['dose_maxima_valor']} {regra['dose_maxima_unidade']}")
    return alerts