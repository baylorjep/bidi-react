import React, { useEffect, useState } from 'react';
import '../../App.css';

function RotatingTextES() {
    const texts = [
        "Fotos de Familia",
        "Limpieza del Hogar",
        "Proyecto de Renovación",
        "Detalle de Coche",
        "Servicio de Mudanza",
        "Trabajo de Jardinería",
        "Proyecto de Pintura",
        "Lección de Idiomas",
        "Proyecto de Diseño Web",
        "Trabajo de Catering",
        "Visita Quiropráctica",
        "Servicio de CPA",
        "Planificación Financiera",
        "Sesión de Tutoría",
        "Reserva de DJ",
        "Entrenamiento Personal",
        "Lección de Piano",
        "Corte de Pelo",
        "Manicura",
        "Gestión de Redes Sociales",
        "Diseño de Interiores",
    ];
    
    
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                return (prevIndex + 1) % texts.length;
            });
        }, 3000);
    
        return () => clearInterval(intervalId);
    }, [texts.length]);
    

    return (
        <div className="rotating-text-wrapper">
            <div className="rotating-text">
                {texts[currentIndex]}
            </div>
        </div>
    );
}

export default RotatingTextES;
