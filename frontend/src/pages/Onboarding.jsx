import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Baby, Stethoscope, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../i18n/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../components/shared/Button';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = 'http://localhost:8000';

const translations = {
  en: {
    title: 'Complete Your Profile',
    subtitle: 'Select your role to get started',
    roleAsha: 'ASHA Worker',
    roleAshaDesc: 'I am a village health worker helping pregnant women',
    roleMother: 'Pregnant Woman',
    roleMotherDesc: 'I want to track my maternal health',
    roleDoctor: 'Doctor',
    roleDoctorDesc: 'I review patient referrals',
    continueButton: 'Continue',
    selectRoleError: 'Please select a role',
    saving: 'Saving...'
  },
  hi: {
    title: 'अपनी प्रोफाइल पूरी करें',
    subtitle: 'शुरुआत करने के लिए एक भूमिका चुनें',
    roleAsha: 'आशा कार्यकर्ता',
    roleAshaDesc: 'मैं गर्भवती महिलाओं की मदद करने वाला एक गांव स्वास्थ्य कार्यकर्ता हूँ',
    roleMother: 'गर्भवती महिला',
    roleMotherDesc: 'मैं अपने मातृ स्वास्थ्य को ट्रैक करना चाहती हूँ',
    roleDoctor: 'डॉक्टर',
    roleDoctorDesc: 'मैं रोगी रेफरल की समीक्षा करता हूँ',
    continueButton: 'जारी रखें',
    selectRoleError: 'कृपया एक भूमिका चुनें',
    saving: 'सहेजा जा रहा है...'
  },
  gu: {
    title: 'તમારી પ્રોફાઇલ પૂર્ણ કરો',
    subtitle: 'શરૂ કરવા માટે એક ભૂમિકા પસંદ કરો',
    roleAsha: 'આશા કાર્યકર્તા',
    roleAshaDesc: 'હું ગર્ભવતી મહિલાઓને મદદ કરતો માણસ છું',
    roleMother: 'ગર્ભવતી મહિલા',
    roleMotherDesc: 'હું મારા માતૃત્વ આરોગ્યને ટ્રૅક કરવા માંગું છું',
    roleDoctor: 'ડૉક્ટર',
    roleDoctorDesc: 'હું દર્દીના રેફરલ્સ જોઉં છું',
    continueButton: 'આગળ વધો',
    selectRoleError: 'કૃપયા એક ભૂમિકા પસંદ કરો',
    saving: 'બચાવવામાં આવે છે...'
  }
};

const RoleCard = ({ icon: Icon, title, description, selected, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`p-6 rounded-lg border-2 transition relative text-left ${
      selected
        ? 'border-orange-500 bg-orange-50'
        : 'border-gray-200 bg-white hover:border-orange-300'
    }`}
  >
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-3 right-3"
      >
        <Check className="w-6 h-6 text-orange-500" />
      </motion.div>
    )}
    <Icon className={`w-8 h-8 mb-3 ${selected ? 'text-orange-600' : 'text-gray-600'}`} />
    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    <p className="text-sm text-gray-600 mt-2">{description}</p>
  </motion.button>
);

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user already has a role, redirect to dashboard
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (userRole) {
      const dashboards = {
        asha: '/asha',
        mother: '/mother',
        doctor: '/doctor'
      };
      navigate(dashboards[userRole] || '/');
    }
  }, [user, userRole, navigate]);

  const handleContinue = async () => {
    setError('');

    if (!selectedRole) {
      setError(t.selectRoleError);
      return;
    }

    setLoading(true);
    try {
      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (updateError) {
        throw updateError;
      }

      // Call backend /auth/me to ensure public.users row exists.
      // Backend uses service-role client and auto-creates missing profile rows.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (sessionError || !token) {
        throw new Error('Unable to verify session after role update. Please sign in again.');
      }

      const meResp = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!meResp.ok) {
        const detail = await meResp.text();
        throw new Error(detail || 'Failed to create user profile.');
      }

      // Redirect to appropriate dashboard
      const dashboards = {
        asha: '/asha',
        mother: '/mother',
        doctor: '/doctor'
      };
      navigate(dashboards[selectedRole]);
    } catch (err) {
      setError(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
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
          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Role Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <RoleCard
              icon={Users}
              title={t.roleAsha}
              description={t.roleAshaDesc}
              selected={selectedRole === 'asha'}
              onClick={() => setSelectedRole('asha')}
            />
            <RoleCard
              icon={Baby}
              title={t.roleMother}
              description={t.roleMotherDesc}
              selected={selectedRole === 'mother'}
              onClick={() => setSelectedRole('mother')}
            />
            <RoleCard
              icon={Stethoscope}
              title={t.roleDoctor}
              description={t.roleDoctorDesc}
              selected={selectedRole === 'doctor'}
              onClick={() => setSelectedRole('doctor')}
            />
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={loading || !selectedRole}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? t.saving : t.continueButton}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
