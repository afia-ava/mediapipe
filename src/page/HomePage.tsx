import { Link } from 'react-router-dom';
import kinesthetics1 from '../assets/kinesthetics1.png';
import kinesthetics2 from '../assets/kinesthetics2.png';
import kinesthetics3 from '../assets/kinesthetics3.png';

export default function HomePage() {
    const games = [
        {
            route: "/statuesque",
            image: kinesthetics1
        },
        {
            route: "/flappy-bird",
            image: kinesthetics2
        },
        {
            route: "/pong",
            image: kinesthetics3
        }
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
            <h1 className="font-architype text-6xl font-bold text-black mb-4 font-serif mt-0 -mt-8">
                Kinesthetic Games
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {games.map((game, idx) => (
                    <Link
                        key={idx}
                        to={game.route}
                        className="block p-0.5 rounded-lg shadow-lg text-center bg-gradient-to-br from-neutral-800 to-neutral-900 transform transition-transform hover:scale-105 border border-neutral-400 flex justify-center items-center"
                    >
                        <img src={game.image} alt="Game" className="h-[30rem] w-[26rem] object-cover rounded-md" style={{margin: '1mm'}} />
                    </Link>
                ))}
            </div>
        </div> 
    );
}
