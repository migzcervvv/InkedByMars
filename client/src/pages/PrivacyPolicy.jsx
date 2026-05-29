import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-bg text-ink font-body px-4 py-10 md:px-10">
      <div className="max-w-4xl mx-auto bg-surface shadow-leather rounded-2xl p-6 md:p-10 border border-leather/20">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-leather">
            Privacy Policy
          </h1>
          <p className="text-ash mt-2 text-sm md:text-base">
            Effective Date: May 29, 2026
          </p>
        </header>

        <section className="space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            This Privacy Policy explains how personal information is collected,
            used, and protected when you use this website.
          </p>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              1. Information Collected
            </h2>
            <p>
              We collect the following personal information when voluntarily
              submitted by users:
            </p>
            <ul className="list-disc pl-6 mt-2 text-ash">
              <li>Name</li>
              <li>Email address</li>
              <li>Contact number</li>
            </ul>
            <p className="mt-2">
              No additional personal data is collected without user input.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              2. How Information Is Used
            </h2>
            <p>
              Collected information is used strictly for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-2 text-ash">
              <li>Responding to inquiries and messages</li>
              <li>Providing service-related updates and notifications</li>
              <li>Managing user communication and support</li>
            </ul>
            <p className="mt-2">
              Email communications are limited to notifications related to user
              activity or service updates. No newsletters or marketing emails
              are sent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              3. Communication
            </h2>
            <p>
              Users may contact us directly through email or social media
              channels linked on the website. All communications are handled for
              support or service purposes only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              4. Data Sharing
            </h2>
            <p>
              Personal information is not sold, rented, or traded to third
              parties. Data may only be shared if required by law or to protect
              legal rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              5. Data Security
            </h2>
            <p>
              Reasonable technical and organizational measures are applied to
              protect personal data from unauthorized access, alteration,
              disclosure, or destruction.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              6. Data Retention
            </h2>
            <p>
              Personal information is retained only for as long as necessary to
              fulfill the purposes outlined in this policy or as required by
              law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              7. User Rights
            </h2>
            <p>
              Users may request access, correction, or deletion of their
              personal data by contacting the provided communication channels.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              8. Changes to This Policy
            </h2>
            <p>
              This Privacy Policy may be updated periodically. Continued use of
              the website after changes constitutes acceptance of the updated
              policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display text-leather mb-2">
              9. Contact Information
            </h2>
            <p>
              Privacy-related concerns may be directed through the website’s
              contact email or official social media pages.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
