'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthFormProps {
    mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (mode === 'register') {
            if (!formData.username.trim()) {
                setError('Username is required');
                return;
            }
            if (!formData.email.trim()) {
                setError('Email is required');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        } else {
            if (!formData.username.trim()) {
                setError('Username is required');
                return;
            }
            if (formData.username.length < 4) {
                setError('Username must be at least 4 characters long');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }
        }

        setIsLoading(true);
        try {
            if (mode === 'register') {
                await api.post('/auth/register', {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                });
                const response = await api.post('/auth/login', {
                    username: formData.username,
                    password: formData.password,
                });

                const { access_token, user } = response.data;
                localStorage.setItem('token', access_token);
                console.log(access_token)
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Account created successfully!');
                router.push('/chat');
            } else {
                const response = await api.post('/auth/login', {
                    username: formData.username,
                    password: formData.password,
                });

                const { access_token, user } = response.data;
                localStorage.setItem('token', access_token);
                // console.log(access_token)
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Login successful!');
                router.push('/chat');
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-600">
                        {mode === 'login' ? 'Sign in to your account' : 'Join our chat community'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-700"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 transition-colors text-gray-700"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-700"
                                placeholder="Enter your password (min 6 characters)"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-700"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg"
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        <a
                            href={mode === 'login' ? '/register' : '/login'}
                            className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}