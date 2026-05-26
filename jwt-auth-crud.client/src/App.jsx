import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login'; // putanja do komponente
import Home from './Components/Home';
import Register from './Components/Register';
import Unauthorized from './Components/Unauthorized';
import UserDashboard from './Components/UserDashboard';
import AdminDashboard from './Components/AdminDashboard';
import Navbar from './Components/Navbar';  // Importuj Navbar komponentu
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PrivateRoute } from './routes/PrivateRoute';

function App() {
    return (
        <div>
                {/* Pozivanje Navbar komponente */}
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                {/* User Routes */}
                    <Route element={<PrivateRoute allowedRoles={['User']} />}>
                        <Route path="/user-dashboard" element={<UserDashboard />} />
                    </Route>

                {/* Admin Routes */}
                    <Route element={<PrivateRoute allowedRoles={['Admin']} />}>
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    </Route>

                    <Route path="*" element={<p>404 - Stranica nije pronađena</p>} />
                </Routes>

            {/* Footer */}
            <footer className="bg-light text-center py-3 mt-auto w-100 fixed-bottom">
                <p>&copy; 2025 ImelApp. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

export default App;
