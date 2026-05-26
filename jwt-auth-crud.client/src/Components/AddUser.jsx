import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function AddUser({ title, currentUser, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', repeatPassword: '', isActive: true, role: ''
    });
    // Tracks which fields have been touched (for displaying validation messages)
    const [touched, setTouched] = useState({});

    // Toggle visibility for password and confirm password fields
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

    // If user exists (editing mode), populate form with user data (password fields remain empty for security)
    useEffect(() => {
        if (currentUser) {
            const role = currentUser.role === "Admin" ? "1" : (currentUser.role === "User" ? "0" : "");

            setFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                password: '', // remains empty for security
                repeatPassword: '', // remains empty for security
                isActive: currentUser.isActive ?? true,
                role: role,
            });
        }
    }, [currentUser]);

    // Handle input field changes and update form state
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Validation rules for form fields
    const validate = {
        username: (formData.username?.length ?? 0) >= 3,
        email: /\S+@\S+\.\S+/.test(formData.email),
        password: !currentUser ? (formData.password?.length ?? 0) >= 6 : true,
        repeatPassword: !currentUser ? formData.password === formData.repeatPassword && (formData.repeatPassword?.length ?? 0) > 0 : true,
        role: (formData.role?.length ?? 0) > 0
    };

    // Helper functions to determine error or success state for display
    const showError = (field) => touched[field] && !validate[field];
    const showSuccess = (field) => touched[field] && validate[field];

    // Get validation message based on field state
    const getMessage = (field) => {
        if (!touched[field]) return '';
        if (!validate[field]) {
            switch (field) {
                case 'username': return 'Minimum 3 characters';
                case 'email': return 'Invalid email format';
                case 'password': return 'Minimum 6 characters';
                case 'repeatPassword': return 'Passwords do not match';
                case 'role': return 'You must select a role';
                default: return '';
            }
        }
        return '';
    };

    // Handle form submission - validates and sends user data to API
    const handleSubmit = async (e) => {
        const token = sessionStorage.getItem('token');

        e.preventDefault();
        setTouched({ username: true, email: true, password: true, repeatPassword: true, role: true });

        // Validation: all fields must be valid before submission
        if (!Object.values(validate).every(Boolean)) {
            toast.error("Failed to add user. Please check all fields!");
            return;
        }

        try {
            // Prepare API endpoint URL based on whether creating or editing user
            const url = currentUser
                ? `${import.meta.env.VITE_API_URL}/edit/${currentUser.id}`
                : `${import.meta.env.VITE_API_URL}/register`;

            // Use PUT for editing existing user, POST for creating new user
            const method = currentUser ? 'put' : 'post';

            // Base data sent in all requests
            const data = {
                username: formData.username,
                email: formData.email,
                isActive: formData.isActive,
            };

            // Only include password and role if they are provided
            if (formData.password?.trim()) {
                data.password = formData.password;
            }

            if (formData.role?.trim()) {
                data.role = formData.role;
            }

            // Make API request with prepared data and authentication token
            const res = await axios[method](url, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.status === 200 || res.status === 201) {
                toast.success('User successfully ' + (currentUser ? 'updated' : 'added') + '. Closing modal...');
                onSuccess();
                setTimeout(onClose, 1500);
            } else {
                toast.error(res.data?.message || 'Error adding/updating user.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Server error.');
        }
    };


    return (
        <div className="container" style={{ width: '600px' }}>
            <div className="card shadow p-4 bg-light">
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose}></button>
                <h2 className="text-center mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="text-end" noValidate>

                    {/* Render form fields dynamically - username, email, password, and confirm password */}
                    {['username', 'email', 'password', 'repeatPassword'].map((field) => {

                        // Note: Password fields are shown for both create and edit modes
                        // User can update password without providing current password
                        // if (currentUser && field === 'password') return null;
                        // if (currentUser && field === 'repeatPassword') return null;

                        // Determine if field is password type and manage visibility toggle
                        const isPassword = field === 'password' || field === 'repeatPassword';
                        const show = field === 'password' ? showPassword : field === 'repeatPassword' ? showRepeatPassword : false;
                        const toggleShow = () => {
                            if (field === 'password') setShowPassword(prev => !prev);
                            if (field === 'repeatPassword') setShowRepeatPassword(prev => !prev);
                        };

                        return (
                            <div className="mb-3" key={field}>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label mb-0 text-capitalize">{field === 'repeatPassword' ? 'Repeat password ' : field}</label>
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

                    {/* Role selection dropdown */}
                    <div className="mb-3 text-start">
                        <label className="form-label">Rola</label>
                        <select
                            name="role"
                            className={`form-select ${showError('role') ? 'is-invalid' : showSuccess('role') ? 'is-valid' : ''}`}
                            value={formData.role}
                            onChange={handleChange}
                            onBlur={() => setTouched({ ...touched, role: true })}
                        >
                            <option value="">Choose user role</option>
                            <option value="1">Admin</option>
                            <option value="0">User</option>
                        </select>
                        <small className={`ms-auto text-end ${showError('role') ? 'text-danger' : showSuccess('role') ? 'text-success' : 'text-muted'}`} style={{ minHeight: '1rem', fontSize: '0.8rem' }}>
                            {getMessage('role')}
                        </small>
                    </div>

                    {/* User status toggle - active or inactive */}
                    <div className="form-check mb-5 text-start form-switch">
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

                    <div className="d-flex justify-content-between align-items-center">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            <button type="submit" className="btn btn-success text-end">{currentUser ? 'Save Changes' : 'Add User'}</button>
                    </div>
                </form>

                {/* Toast notification container for user feedback */}
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

export default AddUser;
