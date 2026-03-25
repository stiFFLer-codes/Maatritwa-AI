import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, Users, Stethoscope, Baby, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../i18n/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/shared/LanguageToggle';
import Button from '../components/shared/Button';

const translations = {
  en: {
    title: 'Join मातृत्व AI',
    subtitle: 'Create your account to start your health journey',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'Password (minimum 6 characters)',
    passwordPlaceholder: 'Create a secure password',
    selectRole: 'Select Your Role',
    roleAsha: 'ASHA Worker',
    roleAshaDesc: 'Village health worker',
    roleMother: 'Pregnant Woman',
    roleMotherDesc: 'Track your health',
    roleDoctor: 'Doctor',
    roleDoctorDesc: 'Review referrals',
    signUpButton: 'Create Account',
    haveAccount: 'Already have an account?',
    signInLink: 'Sign In',
    errorMessage: 'Sign up failed. Please try again.',
    loading: 'Creating account...',
    invalidEmail: 'Please enter a valid email address',
    invalidPassword: 'Password must be at least 6 characters',
    selectRoleError: 'Please select a role',
    success: 'Account created successfully!'
  },
  hi: {
    title: 'मातृत्व AI में शामिल हों',
    subtitle: 'अपना खाता बनाएं और अपनी स्वास्थ्य यात्रा शुरू करें',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'पासवर्ड (न्यूनतम 6 वर्ण)',
    passwordPlaceholder: 'एक सुरक्षित पासवर्ड बनाएं',
    selectRole: 'अपनी भूमिका चुनें',
    roleAsha: 'आशा कार्यकर्ता',
    roleAshaDesc: 'गांव के स्वास्थ्य कार्यकर्ता',
    roleMother: 'गर्भवती महिला',
    roleMotherDesc: 'अपने स्वास्थ्य को ट्रैक करें',
    roleDoctor: 'डॉक्टर',
    roleDoctorDesc: 'रेफरल की समीक्षा करें',
    signUpButton: 'खाता बनाएं',
    haveAccount: 'पहले से खाता है?',
    signInLink: 'साइन इन करें',
    errorMessage: 'साइन अप विफल। कृपया पुनः प्रयास करें।',
    loading: 'खाता बनाया जा रहा है...',
    invalidEmail: 'कृपया एक वैध ईमेल पता दर्ज करें',
    invalidPassword: 'पासवर्ड कम से कम 6 वर्ण की लंबाई का होना चाहिए',
    selectRoleError: 'कृपया एक भूमिका चुनें',
    success: 'खाता सफलतापूर्वक बनाया गया!'
  },
  gu: {
    title: 'માતૃત્વ AI માં જોડાઓ',
    subtitle: 'તમારો ખાતો બનાઓ અને તમારી આરોગ્ય યાત્રા શરૂ કરો',
    emailLabel: 'ઇમેલ સરનામું',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'પાસવર્ડ (ન્યૂનતમ 6 અક્ષર)',
    passwordPlaceholder: 'સુરક્ષિત પાસવર્ડ બનાવો',
    selectRole: 'તમારી ભૂમિકા પસંદ કરો',
    roleAsha: 'આશા કાર્યકર્તા',
    roleAshaDesc: 'ગામ આરોગ્ય કાર્યકર',
    roleMother: 'ગર્ભવતી મહિલા',
    roleMotherDesc: 'તમારા આરોગ્યને ટ્રૅક કરો',
    roleDoctor: 'ડૉક્ટર',
    roleDoctorDesc: 'રેફરલ્સ જોવો',
    signUpButton: 'ખાતો બનાવો',
    haveAccount: 'પહેલાથી ખાતો છે?',
    signInLink: 'સાઇન ઇન',
    errorMessage: 'સાઇન અપ નિષ્ફળ. કૃપયા ફરીથી પ્રયાસ કરો.',
    loading: 'ખાતો બનાવવામાં આવે છે...',
    invalidEmail: 'કૃપયા એક માન્ય ઇમેલ સરનામું દાખલ કરો',
    invalidPassword: 'પાસવર્ડ ઓછામાં ઓછો 6 અક્ષર હોવો જોઇએ',
    selectRoleError: 'કૃપયા એક ભૂમિકા પસંદ કરો',
    success: 'ખાતો સફળતાથી બનાવવામાં આવ્યો!'
  }
};

const RoleCard = ({ icon: Icon, title, description, selected, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`p-4 rounded-lg border-2 transition relative ${
      selected
        ? 'border-orange-500 bg-orange-50'
        : 'border-gray-200 bg-white hover:border-orange-300'
    }`}
  >
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-2 right-2"
      >
        <Check className="w-5 h-5 text-orange-500" />
      </motion.div>
    )}
    <Icon className={`w-8 h-8 mx-auto mb-2 ${selected ? 'text-orange-600' : 'text-gray-600'}`} />
    <h3 className="font-semibold text-gray-900">{title}</h3>
    <p className="text-xs text-gray-600 mt-1">{description}</p>
  </motion.button>
);

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  // ✓ FIX: Removed duplicate signupInFlightRef - rely on loading state instead

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const validateForm = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t.invalidEmail);
      return false;
    }
    if (password.length < 6) {
      setError(t.invalidPassword);
      return false;
    }
    if (!role) {
      setError(t.selectRoleError);
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // Skip if already loading
    if (loading) {
      return;
    }

    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email.trim(), password, role);
      
      if (result?.user) {
        setSuccess(t.success);
        setTimeout(() => {
          navigate(result?.session ? '/onboarding' : '/login');
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.message || t.errorMessage;
      setError(errMsg);
      
      // Set cooldown if rate limited
      if (errMsg.includes('Too many') || errMsg.includes('few minutes')) {
        setCooldownSeconds(180); // 3 minute cooldown for rate limiting
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <LanguageToggle />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
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
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Rate Limit Notice */}
            {cooldownSeconds > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold">Too many signup attempts</p>
                  <p>Please wait {cooldownSeconds}s before trying again. This is a Supabase rate limit for your protection.</p>
                </div>
              </motion.div>
            )}

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

            {/* Success Alert */}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3"
              >
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
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

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.selectRole}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <RoleCard
                  icon={Users}
                  title={t.roleAsha}
                  description={t.roleAshaDesc}
                  selected={role === 'asha'}
                  onClick={() => setRole('asha')}
                />
                <RoleCard
                  icon={Baby}
                  title={t.roleMother}
                  description={t.roleMotherDesc}
                  selected={role === 'mother'}
                  onClick={() => setRole('mother')}
                />
                <RoleCard
                  icon={Stethoscope}
                  title={t.roleDoctor}
                  description={t.roleDoctorDesc}
                  selected={role === 'doctor'}
                  onClick={() => setRole('doctor')}
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={loading || cooldownSeconds > 0}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {cooldownSeconds > 0 ? (
                `${t.loading.split(' ')[0]} (${cooldownSeconds}s)`
              ) : loading ? (
                t.loading
              ) : (
                <>
                  {t.signUpButton}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-gray-600">
            {t.haveAccount}{' '}
            <Link
              to="/login"
              className="text-orange-600 font-semibold hover:text-orange-700 transition"
            >
              {t.signInLink}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
