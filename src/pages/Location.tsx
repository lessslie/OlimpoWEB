const Location = () => {
  const schedules = {
    musculacion: {
      title: 'Sala de Musculación',
      hours: [
        { days: 'Lunes - Viernes', time: '7:00 AM - 10:00 PM' },
        { days: 'Sábados', time: '8:00 AM - 6:00 PM' },
        { days: 'Domingos', time: '9:00 AM - 2:00 PM' },
      ],
    },
    kickboxing: {
      title: 'Clases de Kickboxing',
      hours: [
        { days: 'Lunes, Miércoles, Viernes', time: '7:00 PM - 8:30 PM' },
        { days: 'Sábados', time: '10:00 AM - 11:30 AM' },
      ],
    },
  };

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Nuestra Ubicación
          </h1>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">
              Aquí se integrará el mapa interactivo cuando conectemos con la API de mapas
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Cómo llegar</h2>
              <p className="mt-2 text-gray-600">
                Estamos ubicados en el centro de la ciudad, con fácil acceso desde transporte público y amplias opciones de estacionamiento en los alrededores.
              </p>
              <div className="mt-4">
                <p className="flex items-center text-gray-600">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Av. Principal 123, Ciudad
                </p>
                <p className="mt-1 text-gray-600 ml-7">A una cuadra de la Plaza Central</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios</h3>
                {Object.values(schedules).map((schedule) => (
                  <div key={schedule.title} className="mb-6">
                    <h4 className="font-medium text-gray-900">{schedule.title}</h4>
                    <ul className="mt-2 space-y-2">
                      {schedule.hours.map((hour, index) => (
                        <li key={index} className="text-gray-600">
                          <span className="font-medium">{hour.days}:</span> {hour.time}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transporte</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Transporte Público</h4>
                    <p className="mt-1 text-gray-600">
                      Líneas de autobús 15, 24 y 56 con parada a 100 metros del gimnasio.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Estacionamiento</h4>
                    <p className="mt-1 text-gray-600">
                      Contamos con estacionamiento propio para clientes con capacidad limitada. También hay un estacionamiento público a 200 metros.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Listo para visitarnos?</h3>
                  <p className="text-gray-600 mb-4">
                    Te invitamos a conocer nuestras instalaciones. Puedes agendar una visita guiada o simplemente pasar por nuestro gimnasio.
                  </p>
                  <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors">
                    Agendar visita
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
