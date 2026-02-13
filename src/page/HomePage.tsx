import { Link } from 'react-router-dom';

export default function HomePage() {
    const games = [
        {
            title: "Statusque",
            description: "Mirror ancient Greek poses and pass to new levels",
            route: "/statuesque",
            color: "from-gold to-bronze-light"
        },
        {
            title: "Flappy Bird",
            description: "Navigate through obstacles as a flying bird",
            route: "/flappy-bird",
            color: "from-papyrus-medium to papyrus-dark"
        },
        {
            title: "Game 3",
            description: "Still deciding",
            route: "/game3",
            color: "from-stone-medium to stone-dark"
        }
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <h1 className="text-6xl font-bold text-gold mb-4 font-serif">
                Statuesque
            </h1>
            <p className="text-2xl text-papyrus-light mb-12 font-serif">
                Mimic Greek Pose Games
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {games.map((game) => (
                    <Link
                        key={game.title}
                        to={game.route}
                        className={`block p-6 rounded-lg shadow-lg text-center text-white font-serif bg-gradient-to-br ${game.color} transform transition-transform hover:scale-105 cursor-pointer`}
                    >
                        <h2 className="text-3xl font-bold mb-2">
                            {game.title}
                        </h2>
                        <p className="text-papyrus-light mb-4 font-serif">
                            {game.description}
                        </p>
                        <div className="bg-gold text-stone-dark font-bold py-2 px-4 rounded-full hover:bg-gold-light transition-colors inline-block">
                            Play
                        </div>
                    </Link>
                ))}
            </div>
        </div> 
    );
}