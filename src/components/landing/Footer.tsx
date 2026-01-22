import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Linkedin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Platform: [
      { name: "How It Works", href: "#how-it-works" },
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "For Creators", href: "/register?role=creator" },
      { name: "For Advertisers", href: "/register?role=advertiser" },
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Press", href: "/press" },
    ],
    Support: [
      { name: "Help Center", href: "/help" },
      { name: "Contact Us", href: "/contact" },
      { name: "Trust & Safety", href: "/trust" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">U</span>
              </div>
              <span className="text-xl font-bold text-background">UrAds</span>
            </Link>
            <p className="text-background/70 text-sm mb-4 max-w-xs">
              The trusted marketplace connecting brands with influential creators worldwide.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-background" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-background mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith("#") || link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        className="text-background/70 hover:text-background transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-background/70 hover:text-background transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-background/60 text-sm">
              © {new Date().getFullYear()} UrAds. All rights reserved.
            </p>
            <p className="text-background/60 text-sm">
              Made with ❤️ for creators and brands
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
