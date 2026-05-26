import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register({ title = "Registration" }) {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', repeatPassword: '', isActive: true
    });
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = {
        username: formData.username.length >= 3,
        email: /\S+@\S+\.\S+/.test(formData.email),
        password: formData.password.length >= 6,
        repeatPassword: formData.password === formData.repeatPassword && formData.repeatPassword.length > 0,
    };

    const showError = (field) => touched[field] && !validate[field];
    const showSuccess = (field) => touched[field] && validate[field];

    const getMessage = (field) => {
        if (!touched[field]) return '';
        if (!validate[field]) {
            switch (field) {
                case 'username': return 'Minimum 3 characters';
                case 'email': return 'Invalid email format';
                case 'password': return 'Minimum 6 characters';
                case 'repeatPassword': return 'Passwords do not match';
                default: return '';
            }
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ username: true, email: true, password: true, repeatPassword: true });

        if (!Object.values(validate).every(Boolean)) {
            // Show error toast if validation fails
            toast.error("Registration failed. Please check all fields!");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    isActive: formData.isActive,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setTimeout(() => {
                    toast.success('Registration successful! Redirecting to login...');
                    setTimeout(() => navigate('/login'), 1500);
                }, 500);
            } else {
                toast.error(data.message || 'Error during registration.');
            }
        } catch (err) {
            toast.error('Server error.');
        }
    };

    return (
        <div className="container" style={{ width: '600px' }}>
            <div className="card shadow p-4 bg-light">
                <h2 className="text-center mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="text-end" noValidate>
                    {['username', 'email', 'password', 'repeatPassword'].map((field) => {

                        const isPassword = field === 'password' || field === 'repeatPassword';
                        const show = field === 'password' ? showPassword : field === 'repeatPassword' ? showRepeatPassword : false;
                        const toggleShow = () => {
                            if (field === 'password') setShowPassword(prev => !prev);
                            if (field === 'repeatPassword') setShowRepeatPassword(prev => !prev);
                        };


                        return (
                            <div className="mb-3" key={field}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label mb-0 text-capitalize">{field === 'repeatPassword' ? 'Repeat Password' : field}</label>
                                    <small
                                        className={`ms-auto text-end ${showError(field) ? 'text-danger' : showSuccess(field) ? 'text-success' : 'text-muted'}`}
                                        style={{ minHeight: '1rem', fontSize: '0.8rem' }}
                                    >
                                        {getMessage(field)}
                                    </small>
                                </div>
                                <div className="input-group">
                                    <input
                                        type={isPassword && !show ? 'password' : 'text'}
                                        name={field}
                                        className={`form-control ${showError(field) ? 'is-invalid' : showSuccess(field) ? 'is-valid' : ''}`}
                                        value={formData[field]}
                                        onChange={handleChange}
                                        onBlur={() => setTouched({ ...touched, [field]: true })}
                                    />
                                    {isPassword && (
                                        <span className="input-group-text" onClick={toggleShow} style={{ cursor: 'pointer' }}>
                                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div className="form-check mb-3 text-start form-switch">
                        <input
                            type="checkbox"
                            role="switch"
                            className="form-check-input"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                            {formData.isActive ? 'User will be ACTIVE' : 'User will be INACTIVE'}
                        </label>
                    </div>
                    <button type="submit" className="btn btn-success text-end">Register</button>
                </form>

                {/* Tost container for displaying notifications */}
                <ToastContainer
                    position="top-right"
                    autoClose={2000}
                    hideProgressBar
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </div>
    );
}

export default Register;
