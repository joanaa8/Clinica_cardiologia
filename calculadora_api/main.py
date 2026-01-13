from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

# Configuração da BD
DB_CONFIG = {
    "dbname": "cdss_db", 
    "user": "postgres",
    "password": "ipcAKuKa1214", 
    "host": "localhost",
    "port": "5432"
}

class CalculationRequest(BaseModel):
    med_name: str
    weight: float
    age: int

@app.post("/calculate")
def calculate_dosage(data: CalculationRequest):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Definir População
        populacao = 'adultos'
        if data.age < 18: 
            populacao = 'pediatrico'
        elif data.age >= 65: 
            populacao = 'idosos'

        # 2. Buscar Regra Mais Adequada
        # Prioriza a regra específica da faixa etária, mas aceita 'intro_geral' (fallback)
        query = """
            SELECT r.*, m.nome_comercial 
            FROM cdss.posologia_regras r
            JOIN cdss.medicamentos m ON r.medicamento_id = m.id
            WHERE m.nome_comercial ILIKE %s 
            AND (r.faixa_etaria = %s OR r.faixa_etaria = 'intro_geral')
            ORDER BY 
                CASE WHEN r.faixa_etaria = %s THEN 1 ELSE 2 END, -- Prioriza a faixa exata
                r.pontuacao_confianca DESC
            LIMIT 1
        """
        cur.execute(query, (f"%{data.med_name}%", populacao, populacao))
        regra = cur.fetchone()
        
        if not regra:
            return {"found": False, "message": f"Nenhuma regra de dosagem encontrada para '{data.med_name}' na população '{populacao}'."}

        # 3. Calcular e Validar
        resultado = processar_calculo(regra, data.weight, populacao)

        return {
            "found": True,
            "medicamento": regra['nome_comercial'],
            "populacao_detectada": populacao,
            "calculo": resultado['calculo'],
            "alertas": resultado['alertas'],
            "limites": resultado['limites'],
            "nota_clinica": regra.get('texto_revisao')
        }

    except Exception as e:
        print(f"Erro na API: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor de cálculo")
    finally:
        if conn:
            conn.close()

def processar_calculo(regra, peso, populacao):
    """
    Realiza o cálculo matemático e compara com os limites (min/max/teto).
    """
    calculo = {}
    alertas = []
    limites_info = {} # Para debugging ou info extra no frontend

    # --- A. LÓGICA PEDIÁTRICA (Baseada em Peso) ---
    if populacao == 'pediatrico' and regra['dose_por_kg_valor_min']:
        dose_min_kg = float(regra['dose_por_kg_valor_min'])
        dose_max_kg = float(regra['dose_por_kg_valor_max'] or dose_min_kg)
        unidade = regra['dose_por_kg_unidade']

        # 1. Cálculo Base (Teórico)
        dose_total_min = dose_min_kg * peso
        dose_total_max = dose_max_kg * peso
        
        calculo['tipo'] = "Pediátrico (Baseado no Peso)"
        calculo['detalhe_matematico'] = f"{dose_min_kg} - {dose_max_kg} {unidade} x {peso}kg"

        # 2. Verificação de Teto Máximo (Safety Check)
        teto_maximo = float(regra['dose_maxima_valor']) if regra['dose_maxima_valor'] else None
        
        if teto_maximo:
            limites_info['teto_maximo'] = f"{teto_maximo} {regra['dose_maxima_unidade']}"
            
            # Valida Limite Superior
            if dose_total_max > teto_maximo:
                alertas.append(f"⚠️ A dose calculada ({dose_total_max:.2f}) excede o teto máximo de {teto_maximo} {regra['dose_maxima_unidade']}. A dose foi ajustada para o limite seguro.")
                dose_total_max = teto_maximo # Capa a dose
                
            # Valida Limite Inferior (Raro, mas se o mínimo calculado for maior que o máximo absoluto, é um erro grave)
            if dose_total_min > teto_maximo:
                alertas.append(f"⛔ PERIGO: A dose mínima calculada pelo peso ({dose_total_min:.2f}) é SUPERIOR ao teto máximo absoluto ({teto_maximo}). Verifique os dados clínicos!")
                dose_total_min = teto_maximo

        # Formatação Final
        calculo['dose_recomendada'] = f"{dose_total_min:.2f} - {dose_total_max:.2f} {unidade}"
        calculo['instrucao'] = regra['dose_por_kg_texto'] or "Administrar conforme frequência indicada."

    # --- B. LÓGICA ADULTO / STANDARD (Dose Fixa) ---
    elif regra['dose_usual_valor_min']:
        val_min = float(regra['dose_usual_valor_min'])
        val_max = float(regra['dose_usual_valor_max'] or val_min)
        unidade = regra['dose_usual_unidade']
        
        calculo['tipo'] = "Standard (Dose Usual)"
        
        if val_min == val_max:
             calculo['dose_recomendada'] = f"{val_min} {unidade}"
        else:
             calculo['dose_recomendada'] = f"{val_min} - {val_max} {unidade}"
        
        calculo['instrucao'] = regra['dose_usual_texto']
        
        # Validação extra (caso exista um teto máximo definido que seja diferente da dose usual)
        teto_maximo = float(regra['dose_maxima_valor']) if regra['dose_maxima_valor'] else None
        if teto_maximo and val_max > teto_maximo:
             alertas.append(f"⚠️ A dose usual registada ({val_max}) parece exceder o teto máximo ({teto_maximo}). Atenção.")

    else:
        # Fallback se não houver dados numéricos
        calculo['tipo'] = "Informativo"
        calculo['dose_recomendada'] = "Ver texto clínico"
        calculo['instrucao'] = regra.get('texto_revisao', 'Sem informação estruturada.')

    # --- C. Verificação de Doses Iniciais (Se aplicável) ---
    if regra['dose_inicial_valor_min']:
        init_min = float(regra['dose_inicial_valor_min'])
        calculo['dose_inicial_sugerida'] = f"{init_min} {regra['dose_inicial_unidade']}"
        limites_info['dose_inicial'] = f"{init_min} {regra['dose_inicial_unidade']}"

    return {"calculo": calculo, "alertas": alertas, "limites": limites_info}