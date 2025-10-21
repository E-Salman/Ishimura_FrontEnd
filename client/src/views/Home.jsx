import ColeccionableDestacado from "../components/ColeccionableDestacado";
import HomeCarousel from "../components/HomeCarousel";
import { NavLink } from "react-router-dom";

const Home = () => {
    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
            <div className="flex h-full grow flex-col">
                <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
                    <div className="w-full max-w-7xl">
                        <div className="relative flex min-h-[500px] items-center justify-center rounded-xl bg-cover bg-center p-8 text-center text-white" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQC9BJKb4Xkbrt2eKzXz359C1ONzqzkHYJ-BWy1WWFMwIF-CQE4VmPZuNCoCvHpC7a5mZTrAaqoQ8TgRIxnYRQpVtNVEq7eTRkfLiODp_FRPJd0H4a44iGo9gR2FxFpYw-i8PAZRNqNtG7Qv3tLhOg93GhRwrFqUZNXfM2QPpsJWmSDHLHo46aEO-C-uI8CSuhNvQU1hK2W_q37UFI82cOQCfswIldz5RXrIZlYdOlyxTyueHar4B4bMrbY0EwDstMLhZ8RukUBXs");' }}>
                            <div className="flex flex-col items-center gap-4">
                                <HomeCarousel />
                            </div>
                        </div>

                        <section className="py-12">
                            <h2 className="mb-6 text-2xl font-bold text-[rgb(79_255_207_/var(--tw-bg-opacity,1))]">Figuras Destacadas</h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {[1, 2, 3, 4].map((id) => (
                                    <NavLink
                                        key={id}
                                        to={`/coleccionable/${id}`}
                                        className="group mx-auto w-full max-w-[250px] transition-transform duration-300 hover:scale-105"
                                        state={{ id }} // You can pass extra data if needed
                                    >
                                        <div className="overflow-hidden rounded-lg aspect-[3/4]">
                                            <ColeccionableDestacado colId={id} />
                                        </div>
                                    </NavLink>
                                ))}
                            </div>
                        </section>                                                
                    </div>
                </main>
                
            </div>
        </div>
    )
}
export default Home;