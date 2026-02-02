import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 border border-red-200 rounded-lg m-4">
                    <h1 className="text-xl font-bold text-red-800 mb-2">Đã xảy ra lỗi hiển thị (Blank Page Error)</h1>
                    <p className="text-red-700 mb-4">Vui lòng chụp ảnh màn hình lỗi này gửi cho kỹ thuật viên.</p>
                    <details className="whitespace-pre-wrap text-xs text-red-900 bg-red-100 p-4 rounded overflow-auto max-h-96">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
