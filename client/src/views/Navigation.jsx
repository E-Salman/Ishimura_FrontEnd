import { Link } from 'react-router-dom'
const Navigation = () => {
    return (
        <>
        <nav>
            <ul>
                <li>
                    <Link to='/home'>Casa</Link>
                </li>
                <li>
                    <Link to='/contact'>Contacto</Link>
                </li>
                <li>
                    <Link to='/marcas'>Marcas</Link>
                </li>
                <li>
                    <Link to='/Login'>Login</Link>
                </li>
            </ul>
        </nav>
        </>
    )
}
export default Navigation
