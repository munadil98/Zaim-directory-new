import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">অ্যাপ লোড হতে সমস্যা হয়েছে</h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                আবার রিলোড করুন
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                ক্যাশ ক্লিয়ার করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
