import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import AnimatedCard from "../components/AnimatedCard";
import AnimatedButton from "../components/AnimatedButton";
import LanguageSelector from "../components/LanguageSelector";
import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  LanguageIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeartIcon,
  SparklesIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: VideoCameraIcon,
    title: "Video Consultations",
    description: "Face-to-face video calls with healthcare professionals.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Chat Support",
    description: "Instant messaging for quick queries and follow-ups.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: LanguageIcon,
    title: "Multilingual Support",
    description: "Consultations available in multiple languages.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: ClockIcon,
    title: "24/7 Availability",
    description: "Access healthcare support anytime, anywhere.",
    color: "from-orange-500 to-red-500",
  },
];

const stats = [
  { value: "10K+", label: "Happy Patients", icon: HeartIcon },
  { value: "500+", label: "Expert Doctors", icon: ShieldCheckIcon },
  { value: "50K+", label: "Consultations", icon: SparklesIcon },
];

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 px-4 py-2 mb-8 border border-blue-200/50 dark:border-blue-500/30"
          >
            <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Trusted by 10,000+ patients worldwide
            </span>
          </motion.div>

          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
            {t("home.title")}{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {t("home.subtitle")}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-700 dark:text-gray-300"
          >
            {t("home.description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6"
          >
            {!user ? (
              <>
                <Link to="/register">
                  <AnimatedButton
                    variant="primary"
                    className="text-lg px-8 py-3"
                  >
                    {t("home.cta.getStarted")}
                  </AnimatedButton>
                </Link>
                <Link to="/voice-consultation">
                  <AnimatedButton
                    variant="secondary"
                    className="text-lg px-8 py-3"
                  >
                    {t("voice.title")}
                  </AnimatedButton>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard">
                  <AnimatedButton
                    variant="primary"
                    className="text-lg px-8 py-3"
                  >
                    {t("navigation.dashboard")}
                  </AnimatedButton>
                </Link>
                <Link to="/book-appointment">
                  <AnimatedButton
                    variant="secondary"
                    className="text-lg px-8 py-3"
                  >
                    Book Appointment
                  </AnimatedButton>
                </Link>
              </>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="mt-24 py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Why Choose E-Consultancy?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Experience healthcare like never before.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <AnimatedCard className="h-full p-6">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div
                      className={`rounded-full bg-gradient-to-r ${feature.color} p-3 text-white shadow-lg`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>

          {/* Conditional CTA or Footer */}
          {!user ? (
            <div className="mt-16 text-center">
              <Link to="/register">
                <AnimatedButton variant="primary" className="text-lg px-8 py-3">
                  Start Your Journey Today
                </AnimatedButton>
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer - Only show when user is logged in */}
      {user && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* About Section */}
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  E-Consultancy
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your trusted platform for online medical consultations.
                  Connect with healthcare professionals from the comfort of your
                  home, 24/7 access to quality healthcare services.
                </p>
                <div className="flex gap-4">
                  <Link to="/dashboard">
                    <AnimatedButton
                      variant="primary"
                      className="text-sm px-6 py-2"
                    >
                      Go to Dashboard
                    </AnimatedButton>
                  </Link>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/consultation"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      AI Consultation
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/voice-consultation"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Voice Chat
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/book-appointment"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Book Appointment
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/medical-history"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Medical History
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/medical-reports"
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Medical Reports
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Us
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Email
                      </p>
                      <a
                        href="mailto:support@e-consultancy.com"
                        className="text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        support@e-consultancy.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <PhoneIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Emergency
                      </p>
                      <a
                        href="tel:+1-800-HEALTH"
                        className="text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        1-800-HEALTH (24/7)
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Location
                      </p>
                      <p className="text-gray-900 dark:text-gray-200">
                        Available Worldwide
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  © {new Date().getFullYear()} E-Consultancy. All rights
                  reserved.
                </p>
                <div className="flex gap-6">
                  <Link
                    to="/privacy"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    to="/help"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Help Center
                  </Link>
                </div>
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                <strong>Medical Disclaimer:</strong> The information provided
                through this platform is for informational purposes only and is
                not intended as a substitute for professional medical advice,
                diagnosis, or treatment. Always seek the advice of your
                physician or other qualified health provider with any questions
                you may have regarding a medical condition.
              </p>
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
}
