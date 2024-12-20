import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}