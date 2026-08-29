// components/landing/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="container-responsive py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-slate-400">
        <div>
          <h4 className="font-semibold text-white mb-3">Product</h4>
          <ul className="space-y-2">
            <li>Features</li>
            <li>Pricing</li>
            <li>Changelog</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2">
            <li>About</li>
            <li>Blog</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2">
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Stay updated</h4>
          <p className="text-xs">Join our waitlist for early access.</p>
          {/* input + button could go here */}
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        © 2026 LAW MATE. All rights reserved.
      </div>
    </footer>
  );
}