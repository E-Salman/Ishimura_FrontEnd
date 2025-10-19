import { NavLink } from 'react-router-dom'

const NavBar = ({ todo }) => {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/20 px-10 py-4 text-white">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-3xl">sports_volleyball</span>
                    <h2 className="text-xl font-bold text-white">Action Figure Emporium</h2>
                </div>
                <nav className="hidden items-center gap-8 md:flex">
                    <nav className="hidden items-center gap-8 md:flex">
                        <NavLink className="text-sm font-medium text-white/60 hover:text-primary" to="/home">Home</NavLink>
                        <NavLink className="text-sm font-medium text-white/60 hover:text-primary" to="/categories">Categories</NavLink>
                        <NavLink className="text-sm font-medium text-white/60 hover:text-primary" to="/new-arrivals">New Arrivals</NavLink>
                        <NavLink className="text-sm font-medium text-white/60 hover:text-primary" to="/sales">Sales</NavLink>
                    </nav>

                </nav>
            </div>

            <div className="flex flex-1 items-center justify-end gap-4">
                <div className="hidden lg:flex lg:w-64">
                    <label className="relative block w-full">
                        <span className="sr-only">Search</span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            className="block w-full rounded-full border-none bg-primary/20 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/40"
                            placeholder="Search for figures..."
                            type="text"
                        />
                    </label>
                </div>
                <button className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30">
                    <span className="material-symbols-outlined">favorite_border</span>
                </button>
                <button className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30">
                    <span className="material-symbols-outlined">shopping_cart</span>
                </button>
                <div
                    className="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVhGgHAs8y3INGCPEO7UQGgMw_FaK-5DyeQTf8TM__Kb3s6Z1X9ECxzSvxah-gNbl_Ci_k5m6RAe88Lu2MQZLK2YthWt4LLt9X_qeXpLemv8v7LUBDpvbJFap1qja0xU3XCy2ppX3UmD0zqr8mBIELwqvq4osdrZYJLVqJnqYlwUg7SF-hTMuJONXVZcmcpz7B8i9WGGfiIONWuGMo3pKDdjUhEmeBBLH6T-_kbtab6SaywEJzBULrR5spN3TjQzMI_CbUrT2_-FI");',
                    }}
                ></div>
            </div>
        </header>
    )
}
export default NavBar