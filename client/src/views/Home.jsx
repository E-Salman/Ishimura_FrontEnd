const Home = () => {
return (
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
                <div className="flex h-full grow flex-col">
                    <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
                        <div className="w-full max-w-7xl">
                            <div className="relative flex min-h-[500px] items-center justify-center rounded-xl bg-cover bg-center p-8 text-center text-white" style={{backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQC9BJKb4Xkbrt2eKzXz359C1ONzqzkHYJ-BWy1WWFMwIF-CQE4VmPZuNCoCvHpC7a5mZTrAaqoQ8TgRIxnYRQpVtNVEq7eTRkfLiODp_FRPJd0H4a44iGo9gR2FxFpYw-i8PAZRNqNtG7Qv3tLhOg93GhRwrFqUZNXfM2QPpsJWmSDHLHo46aEO-C-uI8CSuhNvQU1hK2W_q37UFI82cOQCfswIldz5RXrIZlYdOlyxTyueHar4B4bMrbY0EwDstMLhZ8RukUBXs");'}}>
                                <div className="flex flex-col items-center gap-4">
                                    <h1 className="text-4xl font-black leading-tight tracking-tight text-primary md:text-6xl">Collect the Legends</h1>
                                    <p className="max-w-2xl text-base font-normal text-white/80 md:text-lg">
                                        Explore a vast collection of action figures from your favorite universes. Find rare collectibles and new releases.
                                    </p>
                                    <button className="mt-4 rounded-full bg-primary px-8 py-3 text-base font-bold text-black hover:bg-opacity-90">
                                        Shop Now
                                    </button>
                                </div>
                            </div>
                            <section className="py-12">
                                <h2 className="mb-6 text-2xl font-bold text-white">Featured Figures</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    <div className="group">
                                        <div className="overflow-hidden rounded-lg">
                                            <div className="aspect-square w-full transform bg-cover bg-center transition-transform duration-300 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB3KyL1Tb1gJfiC_-QBgx5L4aQTDewTlnFal2bjTAP4Lp51_2lIl2LDUBW1MZTdIcuiyNhoxp9xNAZC4KsX65cplwZb6kFjDxSG4uVJWSoO4aDzBr-M7g26efCToTvFBciTnbmqQp9jisxQHJRP975SRErJUKcb2iNZBwieVforLZkDj9m7FqfnhdITQeq0eSQvJGxIDS6gBfGegA7NqsJFdwYIL322lCYnk2B3SqEJ5bNy-ky2eZxTYWvgQVyI2Z2iQ7QOdzLVdwM");'}}></div>
                                        </div>
                                        <div className="pt-3">
                                            <h3 className="font-bold text-white">The Protector</h3>
                                            <p className="text-sm text-white/60">A legendary hero with unmatched strength.</p>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <div className="overflow-hidden rounded-lg">
                                            <div className="aspect-square w-full transform bg-cover bg-center transition-transform duration-300 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBM4V5bfHTCliTP0i_DgD46odHoL915yIoDD_MMgXWb2kSxKPRRxl0T4TCr9DhxhGrQwiscweahYzeCXZMLNOA4UKWUVSqt59tV-YCg4Gszx0R9EbG40X5rO3IIcI4y7A0-itmMhp5Ob3gSMEkm4bEzwRfPek2weDK2d80eKcukBrW7rvn4Hbmyqn-_VDfjNue0EypGk6dCubLX3Hr5Y6dp8eEApleffIXuzjDUpNOLt8nKV-Il7xVK2PKL8MTNe09YkzfdRqY9RfE");'}}></div>
                                        </div>
                                        <div className="pt-3">
                                            <h3 className="font-bold text-white">Galactic Guardian</h3>
                                            <p className="text-sm text-white/60">A fearless warrior from a distant galaxy.</p>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <div className="overflow-hidden rounded-lg">
                                            <div className="aspect-square w-full transform bg-cover bg-center transition-transform duration-300 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSB0Cvq2WIqhLfnUzB2oGhemz4OUrnMsN7_i3um4ouO9xMavCpUf2yR9q_0TAhH7W46GZqoxeM-eQsOrj-rbXosQNve8TByFM14iwesgfZE_QkhSzJ0e3rbaix6gfrGBFAqJFqtiv-ZoWleDGadHtt1WcyaDrHZzVV2eAdkOLDnKn35UTHCtZ_-bqqbpeOJyquW9rnmlTf1wWantu2IsnTEhkPaQ1OiaD0OKRf9u0G78a9IORq_WIh-BnIqxGrpxP7zlivY6atBEc");'}}></div>
                                        </div>
                                        <div className="pt-3">
                                            <h3 className="font-bold text-white">Mystic Beast</h3>
                                            <p className="text-sm text-white/60">A mythical creature with magical powers.</p>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <div className="overflow-hidden rounded-lg">
                                            <div className="aspect-square w-full transform bg-cover bg-center transition-transform duration-300 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC_20YcCRRhx1tXK-v12I6NRiKxOhsro-bv_m7SXAM6IYe1ug3-DjPLfXHii5L18uSdLOT_7BJQ9-PZ0WP2_NCRTCFOsO96Ea2gkf54_iHad55smLJwEXVD2xy0ftqQrFHq7usvTHVVTimJUHPkonWM2iqp6xe3P_aqbeVykJmCmT7x8PxF0YLeOduzAwaIDtHULAz-dVorqVBqxGTwh8obHZM4JWZsRnGQqsxjOEVuo_hNVoUOcS82pNXmBP9uw9OAkL9g02QqLaw");'}}></div>
                                        </div>
                                        <div className="pt-3">
                                            <h3 className="font-bold text-white">Cyber Sentinel</h3>
                                            <p className="text-sm text-white/60">The future of law enforcement is here.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section className="py-12">
                                <h2 className="mb-6 text-2xl font-bold text-white">Categories</h2>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxM5RDs8UANU8PModASYdYvYFbpjRvvTpde7fs8mZwW7x4nweIYGpcdlBBikHW06YScW95DJG-VHFczLid4xUn4NwH9uq8EhxONNVu-MTHid60fWgKsAg_XZSIGRZeu8gcW0rNGmLq1NtmfiZ6t_2xZ8v6EZ7YuEgD2xTs0-PKeTL0tLvzNZFay1D5ENVHdri8pfv1sCCxQzozfQwWDrba-iGip28DS2ze-96zEKQ2M0NmjJAsMi7TSoCVX-8eWWi_B5sFPwhI_3Q");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Superheroes</h3>
                                    </a>
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJTjbJh8O9LHEGLW9nZa_ffZdWV_6zt0qA1GV-Z6Zc55uGDvXXQrCuhBht_qeLy01hVbcbni-lHzoeWDpyjQBRxjJvHRnfOOPMqTzQdLmJaoZ06bA-lbZbVxxsijX-D6oAf5kOuo5BH9sm2YdJ5KukMePJy7_WUNFOgEqNtruK04Znm2GQiVoMBVSXG-15hfUr8e0MWti-mF27NVZrTMUHXVRDJP7JGBQ_u_J9xC5BmJpy9j-5LSeN0jC7umeP8uJ92CDYvUrOoEY");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Sci-Fi</h3>
                                    </a>
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8yS5dTD8q7e8NPW4eVHB05WKoQkrMsDHXLXP3KhUCRbkCmh3RrKFgGS3fLre14yTnPYO35C143EuUp-hcMTXfX8696nipL0484AMS7EcjwxPWGVLLm4Snj3cGRtrVISgg1NUyzLL3nDMyLzc0kcSrwrkO9skxKj3gftKdAVSMrRI5RV5v7gOwpSYdXkRiVlA6k__1fA6a2vZma6wHHgjMvvatfH7MHy1LKE5-KhcFdRsoUShaZ0QF-QR3MpnCUW0eExYYG72Mt_c");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Fantasy</h3>
                                    </a>
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCbxIq6i8xE4RuzEBQyt-DyYwXBYt_uiveWp5Vv8hkIXTniDpKOFwgji9YD7AMvEX_98FjtD7VJRhQUvo_rT4oLgcFM2gHAM6hgxJzpB0gnt1LzZ2kmf4G6rc68jCc-AabZKgDEPwH95O9LaYoItc9Phwy4HKWoozB2L4j_Ryqc0XcXyy03PfOe-uadpb8ix6p3-OjFvEdacLcKWUcw_xUEw2rzP7cRXQMYZ5I3GDImC7F-yNBWBqeua2DYVKcXjSsji-BMHiFrW3I");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Anime</h3>
                                    </a>
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB2JGEhKkaKUhW5akqQfYBk8hI9RMbhkHE-lSAKrC3L0ie8KlNkP30KGCXPjn6TcXbeKgfZ49KqpeEMy6ZXXOl-TLLzSbzNwEZmRA6wWUta7fZx3SBUmB7WwylkaCPAXqqZteS9l-zn5-WQMlSsg3wwpiSPo8JRL0-ZLjFj8FOG7VA9Y-N8I8jO9LPhoWUTFVu3gwTgRQl2D6_cqgZhO4rIj28MuvfyP4BfWMV41wvtJ9yzu3EtlIRAxn6fyZayKXoKKtxVvBBRaN0");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Vintage</h3>
                                    </a>
                                    <a className="group block" href="#">
                                        <div className="relative overflow-hidden rounded-lg">
                                            <div className="aspect-1 w-full bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDQw94pIUX7sTKMX6UU4W3SJh7Jt1C6Gi6u6xcDzFnMgFW7en0YzExTVvL01ndEktStDoqJ-pqLFbF-XVPKzHPrJy1xlqDvtvjmOjfsqM0QDy2boWaIO2_9F1aZVwamMa8afj64mqQEqUoLwApHWQak28VHgxOR5KG0qrd1S6V4RS1BNQL5yDg8jaPIQiLm0jcy0CSiqfBjosNK0FMe14OvExn7yiM7iZwgk-Rhr_t03KDS3JHG0IOqulz-BrbIwZ85b-4NE4d_14Y");'}}></div>
                                            <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-primary/30"></div>
                                        </div>
                                        <h3 className="mt-2 text-center font-semibold text-white group-hover:text-primary">Limited Edition</h3>
                                    </a>
                                </div>
                            </section>
                            <div className="rounded-lg bg-primary/10 p-8 text-center">
                                <h2 className="text-3xl font-bold text-primary">Join the Collector's Club</h2>
                                <p className="mx-auto mt-2 max-w-2xl text-white/60">
                                    Get exclusive access to new releases, special sales, and connect with a community of fellow collectors.
                                </p>
                                <button className="mt-6 rounded-full bg-primary px-8 py-3 text-base font-bold text-black hover:bg-opacity-90">
                                    Sign Up Now
                                </button>
                            </div>
                        </div>
                    </main>
                    <footer className="border-t border-primary/20">
                        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-center">
                                <a className="text-sm text-white/60 hover:text-primary" href="#">About Us</a>
                                <a className="text-sm text-white/60 hover:text-primary" href="#">Contact</a>
                                <a className="text-sm text-white/60 hover:text-primary" href="#">FAQ</a>
                                <a className="text-sm text-white/60 hover:text-primary" href="#">Privacy Policy</a>
                                <a className="text-sm text-white/60 hover:text-primary" href="#">Terms of Service</a>
                            </div>
                            <div className="mt-8 flex justify-center space-x-6">
                                <a className="text-white/60 hover:text-primary" href="#">
                                    <span className="sr-only">Facebook</span>
                                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path clip-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill-rule="evenodd"></path>
                                    </svg>
                                </a>
                                <a className="text-white/60 hover:text-primary" href="#">
                                    <span className="sr-only">Instagram</span>
                                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path clip-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm6.406-11.845a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fill-rule="evenodd"></path>
                                    </svg>
                                </a>
                                <a className="text-white/60 hover:text-primary" href="#">
                                    <span className="sr-only">Twitter</span>
                                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                                    </svg>
                                </a>
                            </div>
                            <p className="mt-8 text-center text-sm text-white/60">
                                © 2024 Action Figure Emporium. All rights reserved.
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
    )
}
export default Home;