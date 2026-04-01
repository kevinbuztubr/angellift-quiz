import SkinAnalyzer from './analyzer';

export const metadata = {
  title: 'AngelLift® AI Skin Analyzer',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function AnalyzerPage() {
  return <SkinAnalyzer />;
}
