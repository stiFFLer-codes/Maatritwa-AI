function Footer() {
  return (
    <footer className="bg-surface mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold text-primary mb-4">
              मातृत्व AI
            </h3>
            <p className="text-on-surface-variant/80">
              A healthier future for every mother and child.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface mb-4">Navigate</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-on-surface-variant hover:text-primary transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">Features</a>
              </li>
              <li>
                <a href="#about" className="text-on-surface-variant hover:text-primary transition-colors">About</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface mb-4">Roles</h4>
            <ul className="space-y-2">
              <li>
                <a href="/asha" className="text-on-surface-variant hover:text-primary transition-colors">ASHA Worker</a>
              </li>
              <li>
                <a href="/mother" className="text-on-surface-variant hover:text-primary transition-colors">Mother</a>
              </li>
              <li>
                <a href="/doctor" className="text-on-surface-variant hover:text-primary transition-colors">Doctor</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@maatritwa.ai" className="text-on-surface-variant hover:text-primary transition-colors">support@maatritwa.ai</a>
              </li>
              <li>
                <a href="tel:+911234567890" className="text-on-surface-variant hover:text-primary transition-colors">+91 123 456 7890</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-on-surface/10 text-center text-on-surface-variant/60">
          <p>&copy; {new Date().getFullYear()} Maatritwa AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
