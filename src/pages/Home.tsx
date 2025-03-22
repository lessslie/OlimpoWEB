import ImageCarousel from '../components/ImageCarousel';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleContactClick = () => {
    navigate('/contacto');
  };

  const sections = [
    {
      title: 'Musculación',
      description: 'Desarrolla tu fuerza y construye el cuerpo que siempre has deseado. Nuestro gimnasio cuenta con equipamiento de última generación y entrenadores expertos que te guiarán en tu camino hacia tus objetivos físicos.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
          alt: 'Hombre levantando pesas'
        },
        {
          url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
          alt: 'Mujer haciendo ejercicios de peso'
        },
        {
          url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c',
          alt: 'Área de pesas del gimnasio'
        }
      ]
    },
    {
      title: 'Kickboxing',
      description: 'Aprende el arte del kickboxing mientras mejoras tu condición física y autodefensa. Nuestras clases combinan técnicas de boxeo y patadas con un entrenamiento cardiovascular intenso.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1615117972428-28de87ad5a29',
          alt: 'Entrenamiento de kickboxing'
        },
        {
          url: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e',
          alt: 'Práctica de patadas'
        },
        {
          url: 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b',
          alt: 'Entrenamiento con saco de boxeo'
        }
      ]
    },
    {
      title: 'Personal Trainer',
      description: 'Alcanza tus metas más rápido con un entrenador personal dedicado. Programas personalizados, seguimiento constante y motivación para ayudarte a superar tus límites.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
          alt: 'Entrenador personal guiando ejercicios'
        },
        {
          url: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3',
          alt: 'Entrenamiento personalizado'
        },
        {
          url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a',
          alt: 'Ejercicios funcionales con entrenador'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[600px]">
        <img
          src="https://images.unsplash.com/photo-1534367610401-9f5ed68180aa"
          alt="Gimnasio Olimpo"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Gimnasio Olimpo</h1>
            <p className="text-xl">Entrena tu cuerpo, empodera tu mente</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {sections.map((section, index) => (
          <div key={section.title} className={`mb-20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''} lg:flex lg:items-center lg:gap-12`}>
            <div className="lg:w-1/2">
              <ImageCarousel images={section.images} />
            </div>
            <div className="mt-8 lg:mt-0 lg:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <p className="text-lg text-gray-600">{section.description}</p>
              <button 
                onClick={handleContactClick}
                className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                Más información
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-xl mb-8">Únete a nuestra comunidad y transforma tu vida</p>
          <button 
            onClick={handleContactClick}
            className="bg-white text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
            ¡Empieza ahora!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
