import { Loader } from 'lucide-react';

// Shared spinning-loader icon -- replaces the repeated
// `<Loader className="spinner" size={..} />` pattern used across the app.
export default function Spinner({ size = 16, style }) {
  return <Loader className="spinner" size={size} style={style} />;
}
