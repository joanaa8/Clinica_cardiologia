document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem("medico_token");
    const calendarEl = document.getElementById('calendar');

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // FullCalendar
    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt',
            contentHeight: 400, // Força a altura interna do calendário
            aspectRatio: 2,     // Torna o calendário mais "achatado" e largo
            events: function(info, successCallback, failureCallback) {
                const token = localStorage.getItem("medico_token");
                fetch(`/api/consultas/eventos?start=${info.startStr}&end=${info.endStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => successCallback(data))
                .catch(err => failureCallback(err));
            },
            // Lógica para colorir os eventos
            eventDidMount: function(info) {
                const status = info.event.extendedProps.status;
                
                if (status === 'completed') {
                    info.el.style.backgroundColor = '#4caf50'; // Verde para concluídas
                    info.el.style.borderColor = '#4caf50';
                } else if (status === 'cancelled') {
                    info.el.style.backgroundColor = '#f44336'; // Vermelho para canceladas
                    info.el.style.borderColor = '#f44336';
                    info.el.style.textDecoration = 'line-through';
                } else {
                    info.el.style.backgroundColor = '#00bcd4'; // O teu azul atual para agendadas
                    info.el.style.borderColor = '#00bcd4';
                }
            }
        });
        calendar.render();
    }

});