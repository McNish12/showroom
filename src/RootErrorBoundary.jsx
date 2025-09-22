import { Component } from 'react'
import PropTypes from 'prop-types'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Unexpected application error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center text-slate-600">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-heading font-semibold text-ink">Something went wrong</h1>
            <p className="text-sm">
              We’re unable to display the catalog right now. Please refresh the page or try again later.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

RootErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}

export default RootErrorBoundary
