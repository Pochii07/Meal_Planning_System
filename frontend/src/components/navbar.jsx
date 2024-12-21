import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <header>
            <div className="container">
                <Link to="/" className="logo">
                    <h1>Food Planner</h1>
                </Link>
                <nav>
                    <ul className="navbar-links">
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/patients">Patients</Link>
                        </li>
                        <li>
                            <Link to="/recipes">Recipes</Link>
                        </li>
                        <li>
                            <Link to="/about">About</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Navbar