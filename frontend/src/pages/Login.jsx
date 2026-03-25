import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../i18n/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/shared/LanguageToggle';
import Button from '../components/shared/Button';

const translations = {
  en: {
    title: 'Welcome Back to मातृत्व AI',
    subtitle: 'Sign in to continue your maternal health journey',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    signInButton: 'Sign In',
    orText: 'or',
    noAccount: "Don't have an account?",
    signUpLink: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    errorMessage: 'Sign in failed. Please check your email and password.',
    loading: 'Signing in...',
    invalidEmail: 'Please enter a valid email address',
    invalidPassword: 'Password must be at least 6 characters'
  },
  hi: {
    title: 'मातृत्व AI में वापस स्वागत है',
    subtitle: 'अपनी मातृ स्वास्थ्य यात्रा जारी रखने के लिए साइन इन करें',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    signInButton: 'साइन इन करें',
    orText: 'या',
    noAccount: 'खाता नहीं है?',
    signUpLink: 'साइन अप करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    errorMessage: 'साइन इन विफल। कृपया अपना ईमेल और पासवर्ड जांचें।',
    loading: 'साइन इन हो रहे हैं...',
    invalidEmail: 'कृपया एक वैध ईमेल पता दर्ज करें',
    invalidPassword: 'पासवर्ड कम से कम 6 वर्ण की लंबाई का होना चाहिए'
  },
  gu: {
    title: 'માતૃત્વ AI માં આપનું સ્વાગત છે',
    subtitle: 'તમારી માતૃત્વ સ્વાસ્થ્ય યાત્રા ચાલુ રાખવા માટે સાઇન ઇન કરો',
    emailLabel: 'ઇમેલ સરનામું',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'પાસવર્ડ',
    passwordPlaceholder: 'તમારો પાસવર્ડ દાખલ કરો',
    signInButton: 'સાઇન ઇન',
    orText: 'અથવા',
    noAccount: 'ખાતો નથી?',
    signUpLink: 'સાઇન અપ',
    forgotPassword: 'પાસવર્ડ ભૂલી ગયા?',
    errorMessage: 'સાઇન ઇન નિષ્ફળ. કૃપયા તમારો ઇમેલ અને પાસવર્ડ તપાસો.',
    loading: 'સાઇન ઇન થઇ રહ્યું છે...',
    invalidEmail: 'કૃપયા એક માન્ય ઇમેલ સરનામું દાખલ કરો',
    invalidPassword: 'પાસવર્ડ ઓછામાં ઓછો 6 અક્ષર હોવો જોઇએ'
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { login, user, userRole, roleLoading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // ✓ FIX: Removed submittingRef - use loading state instead

  useEffect(() => {
    if (!user) {
      return;
    }

    if (roleLoading) {
      return;
    }

    if (!userRole) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const dashboardByRole = {
      asha: '/asha',
      mother: '/mother',
      doctor: '/doctor'
    };

    navigate(dashboardByRole[userRole] || '/', { replace: true });
  }, [navigate, roleLoading, user, userRole]);

  const validateForm = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t.invalidEmail);
      return false;
    }
    if (password.length < 6) {
      setError(t.invalidPassword);
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // ✓ FIX: Skip if already loading
    if (loading) {
      return;
    }

    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || t.errorMessage);
    } finally {
      setLoading(false);
      // ✓ FIX: No need to reset ref
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <LanguageToggle />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Heart className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {loading ? t.loading : t.signInButton}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t.orText}</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600">
            {t.noAccount}{' '}
            <Link
              to="/signup"
              className="text-orange-600 font-semibold hover:text-orange-700 transition"
            >
              {t.signUpLink}
            </Link>
          </p>
        </motion.div>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            {t.forgotPassword}
          </a>
        </div>
      </motion.div>
    </div>
  );
}
