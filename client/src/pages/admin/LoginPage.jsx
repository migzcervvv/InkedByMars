import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { loadFacebookSDK } from "../../lib/facebook";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fbStatus, setFbStatus] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadFacebook = async () => {
      const FB = await loadFacebookSDK();
      FB.getLoginStatus((response) => {
        statusChangeCallback(response);
      });
    };
    loadFacebook();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const statusChangeCallback = (response) => {
    if (response.status === "connected") {
      setFbStatus("connected");
      const accessToken = response.authResponse.accessToken;
      console.log("ACCESS TOKEN:", accessToken);
      fetchUserProfile();
    } else if (response.status === "not_authorized") {
      setFbStatus("not_authorized");
    } else {
      setFbStatus("unknown");
    }
  };

  const fetchUserProfile = () => {
    window.FB.api("/me", { fields: "id,name,email,picture" }, (response) => {
      setUser(response);
      // FIX 3: navigate after a successful Facebook login
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    });
  };

  const loginWithFacebook = () => {
    setError("");
    setLoading(true);
    window.FB.login(
      (response) => {
        if (response.status === "connected") {
          statusChangeCallback(response);
        } else {
          setError("Facebook login was cancelled or failed. Please try again.");
          setLoading(false);
        }
      },
      { scope: "public_profile,email" },
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (nextError) {
      setError(
        nextError.message ||
          "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid min-h-screen place-items-center bg-ink px-6 text-cream">
      <form
        onSubmit={submit}
        className="w-full max-w-md border border-cream/15 bg-cream/5 p-6 backdrop-blur"
      >
        <div className="grid size-14 place-items-center border border-red text-red">
          <Lock size={22} />
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-red">
          Admin login
        </p>
        <h1 className="mt-2 font-display text-5xl italic leading-none">
          Studio Access
        </h1>
        {error && (
          <p className="mt-5 border border-red bg-red/10 p-3 font-mono text-xs uppercase tracking-[0.12em] text-red">
            {error}
          </p>
        )}
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.16em]">
            Email
            <input
              className="border border-cream/20 bg-cream/10 px-4 py-3 font-body text-2xl normal-case tracking-normal text-cream outline-none focus:border-red"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.16em]">
            Password
            <input
              className="border border-cream/20 bg-cream/10 px-4 py-3 font-body text-2xl normal-case tracking-normal text-cream outline-none focus:border-red"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
          </label>
        </div>
        <Button className="mt-6 w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        {/* FIX 4: wire up the Facebook login button */}
        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-cream/15" />
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-cream/40">
            or
          </span>
          <span className="h-px flex-1 bg-cream/15" />
        </div>
        <Button
          className="mt-4 w-full"
          disabled={loading}
          type="button"
          onClick={loginWithFacebook}
        >
          Continue with Facebook
        </Button>
      </form>
    </section>
  );
}
