import { Card, CardContent, CardHeader } from "../components/shared/Card";
import Button from "../components/shared/Button";
import { Stethoscope, Baby, HeartPulse, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import HeroIllustration from "../components/shared/HeroIllustration";
import { Link } from "react-router-dom";

const MotionCard = motion(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      type: "spring",
      stiffness: 100,
    },
  }),
};

function Landing() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="px-6 py-24">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary mb-6">
                मातृत्व AI
              </h1>
              <p className="text-xl text-on-surface-variant mb-6">
                An AI-powered ecosystem for comprehensive maternal health monitoring.
              </p>
              <p className="text-lg text-on-surface-variant/80 mb-10">
                Empowering ASHA workers, mothers, and doctors with intelligent risk prediction to ensure a healthier future for every mother and child.
              </p>
              <Button size="lg">
                Get Started <ArrowRight className="ml-2" />
              </Button>
            </motion.div>
            <HeroIllustration />
          </div>
        </section>

        {/* Role Selection */}
        <section id="roles" className="px-6 py-24 bg-surface">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-serif font-bold text-center text-primary mb-16"
            >
              Choose Your Role
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* ASHA */}
              <MotionCard custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={cardVariants} className="text-center group">
                <CardHeader>
                  <div className="p-4 bg-secondary/10 rounded-full inline-block group-hover:bg-secondary/20 transition-colors">
                    <HeartPulse size={48} className="text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-on-surface pt-6">
                    ASHA Worker
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-on-surface-variant mb-8">
                    Record patient data and generate maternal risk predictions.
                  </p>
                  <Link to="/asha">
                    <Button variant="secondary" className="group-hover:bg-secondary/90">
                      Open Dashboard <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </CardContent>
              </MotionCard>

              {/* Mother */}
              <MotionCard custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={cardVariants} className="text-center group">
                <CardHeader>
                  <div className="p-4 bg-accent/10 rounded-full inline-block group-hover:bg-accent/20 transition-colors">
                    <Baby size={48} className="text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-on-surface pt-6">
                    Mother
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-on-surface-variant mb-8">
                    Track pregnancy health and understand risk levels clearly.
                  </p>
                  <Link to="/mother">
                    <Button variant="ghost" className="group-hover:bg-accent/10">
                      View Health <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </CardContent>
              </MotionCard>

              {/* Doctor */}
              <MotionCard custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={cardVariants} className="text-center group">
                <CardHeader>
                  <div className="p-4 bg-primary/10 rounded-full inline-block group-hover:bg-primary/20 transition-colors">
                    <Stethoscope size={48} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-on-surface pt-6">
                    Doctor
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-on-surface-variant mb-8">
                    Monitor patient alerts and review high-risk cases.
                  </p>
                  <Link to="/doctor">
                    <Button className="group-hover:bg-primary/90">
                      Review Cases <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </CardContent>
              </MotionCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Landing;