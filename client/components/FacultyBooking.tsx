"use client"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Users, Building, Wifi, WifiOff, Plus, Trash2, LogOut, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
const TIME_SLOTS = ["9-10", "10-11", "11-12", "12-1", "1-2", "2-3", "3-4", "4-5"]

let socket;

export default function FacultyBooking() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [halls, setHalls] = useState([])
  const [bookings, setBookings] = useState([])
  const [faculty, setFaculty] = useState([])
  const [newHall, setNewHall] = useState({ name: "", capacity: "" })
  const [newFaculty, setNewFaculty] = useState({ username: "", password: "", name: "" })
  const [booking, setBooking] = useState({ hall: "", date: "", timeSlot: "", purpose: "" })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set())
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      fetchHalls()
      fetchBookings()
      if (user.role === 'admin') {
        fetchFaculty()
      }
      
      // Initialize socket connection
      socket = io(SOCKET_URL)
      
      socket.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to server')
      })
      
      socket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from server')
      })
      
      socket.on('bookingCreated', (data) => {
        setBookings(prev => [...prev, data.booking])
        
        // Add visual indicator for recently updated slots
        if (data.booking.hall?._id) {
          const slotKey = `${data.booking.hall._id}-${data.booking.date}-${data.booking.timeSlot}`
          setRecentlyUpdated(prev => new Set([...prev, slotKey]))
          
          // Remove the indicator after 3 seconds
          setTimeout(() => {
            setRecentlyUpdated(prev => {
              const newSet = new Set(prev)
              newSet.delete(slotKey)
              return newSet
            })
          }, 3000)
        }
        
        // Show notification to all users except the one who made the booking
        if (data.booking.faculty?._id !== user.id) {
          toast({
            title: "🔴 Hall Booked!",
            description: data.message,
            variant: "destructive"
          })
        }
      })
      
      socket.on('bookingDeleted', (data) => {
        setBookings(prev => prev.filter(b => b._id !== data.bookingId))
        // Show notification about cancelled booking
        toast({
          title: "✅ Booking Cancelled",
          description: data.message,
          variant: "default"
        })
      })
      
      return () => {
        socket?.disconnect()
        setIsConnected(false)
      }
    }
  }, [user, toast])

  const fetchHalls = async () => {
    try {
      const res = await fetch(`${API}/halls`)
      setHalls(await res.json())
    } catch (error) {
      console.error('Error fetching halls:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API}/bookings`)
      setBookings(await res.json())
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchFaculty = async () => {
    try {
      const res = await fetch(`${API}/faculty`)
      if (!res.ok) {
        console.error('Failed to fetch faculty:', res.status)
        return
      }
      const data = await res.json()
      setFaculty(data)
    } catch (error) {
      console.error('Error fetching faculty:', error)
      // Don't show error to user if faculty endpoint doesn't exist yet
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        setUser(await res.json())
      } else {
        alert("Invalid credentials")
      }
    } catch (error) {
      alert("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addHall = async () => {
    if (!newHall.name || !newHall.capacity) {
      alert("Please fill all fields")
      return
    }
    try {
      await fetch(`${API}/halls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHall)
      })
      setNewHall({ name: "", capacity: "" })
      fetchHalls()
    } catch (error) {
      alert("Failed to add hall")
    }
  }

  const deleteHall = async (id) => {
    if (confirm("Are you sure you want to delete this hall?")) {
      try {
        await fetch(`${API}/halls/${id}`, { method: "DELETE" })
        fetchHalls()
      } catch (error) {
        alert("Failed to delete hall")
      }
    }
  }

  const addFaculty = async () => {
    if (!newFaculty.username || !newFaculty.password || !newFaculty.name) {
      alert("Please fill all fields")
      return
    }
    try {
      const res = await fetch(`${API}/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaculty)
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Add faculty error:', errorText)
        alert("Failed to add faculty. Please ensure backend is updated.")
        return
      }
      const data = await res.json()
      setNewFaculty({ username: "", password: "", name: "" })
      fetchFaculty()
      toast({
        title: "Success!",
        description: "Faculty added successfully!",
        variant: "default"
      })
    } catch (error) {
      console.error('Add faculty error:', error)
      alert("Failed to add faculty. Please ensure backend is updated.")
    }
  }

  const exportBookings = async () => {
    try {
      const res = await fetch(`${API}/bookings/export`)
      const data = await res.json()
      const csv = [
        'Hall,Faculty,Date,Time Slot,Purpose,Created At',
        ...data.map(b => `"${b.hall}","${b.faculty}","${b.date}","${b.timeSlot}","${b.purpose}","${b.createdAt}"`)
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success!",
        description: "Booking data exported successfully!",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export booking data",
        variant: "destructive"
      })
    }
  }

  const deleteFaculty = async (id) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      try {
        await fetch(`${API}/faculty/${id}`, { method: "DELETE" })
        fetchFaculty()
        toast({
          title: "Success!",
          description: "Faculty deleted successfully!",
          variant: "default"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete faculty",
          variant: "destructive"
        })
      }
    }
  }

  const bookHall = async () => {
    if (!booking.hall || !booking.date || !booking.timeSlot || !booking.purpose) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      })
      return
    }
    
    // Check daily limit before submitting
    const myBookingsToday = bookings.filter(b => 
      b.faculty && b.faculty._id === user.id && b.date === booking.date
    ).length
    
    if (myBookingsToday >= 2) {
      toast({
        title: "Daily Limit Reached",
        description: "You can only book maximum 2 hours per day",
        variant: "destructive"
      })
      return
    }
    
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, faculty: user.id })
      })
      if (res.ok) {
        setBooking({ hall: "", date: "", timeSlot: "", purpose: "" })
        toast({
          title: "Success!",
          description: "Hall booked successfully!",
          variant: "default"
        })
      } else {
        const error = await res.json()
        toast({
          title: "Booking Failed",
          description: error.error || "Slot already booked or booking failed",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Booking failed. Please try again.",
        variant: "destructive"
      })
    }
  }

  const cancelBooking = async (id) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const res = await fetch(`${API}/bookings/${id}`, { method: "DELETE" })
        if (res.ok) {
          toast({
            title: "Success!",
            description: "Booking cancelled successfully!",
            variant: "default"
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to cancel booking",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to cancel booking",
          variant: "destructive"
        })
      }
    }
  }

  const isSlotBooked = (hallId, date, slot) => {
    return bookings.some(b => b.hall && b.hall._id === hallId && b.date === date && b.timeSlot === slot)
  }

  const getBookingForSlot = (hallId, date, slot) => {
    return bookings.find(b => b.hall && b.hall._id === hallId && b.date === date && b.timeSlot === slot)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Building className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hall Booking System
            </CardTitle>
            <p className="text-gray-600 text-sm">College Management Portal</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input 
                  id="username"
                  placeholder="Enter your username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    Admin Dashboard
                    {isConnected ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                        <Wifi className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </h1>
                  <p className="text-gray-600 text-sm">Manage halls and monitor bookings</p>
                </div>
              </div>
              <Button onClick={() => setUser(null)} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="halls" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
              <TabsTrigger value="halls" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Manage Halls</TabsTrigger>
              <TabsTrigger value="faculty" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Manage Faculty</TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">All Bookings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="halls" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Add New Hall
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Hall Name" 
                      value={newHall.name} 
                      onChange={(e) => setNewHall({...newHall, name: e.target.value})} 
                      className="flex-1"
                    />
                    <Input 
                      type="number" 
                      placeholder="Capacity" 
                      value={newHall.capacity} 
                      onChange={(e) => setNewHall({...newHall, capacity: e.target.value})} 
                      className="w-32"
                    />
                    <Button onClick={addHall} className="bg-blue-600 hover:bg-blue-700 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Hall
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Available Halls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Capacity</TableHead>
                          <TableHead className="font-semibold">Today's Status</TableHead>
                          <TableHead className="font-semibold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {halls.map(hall => {
                          const todayBookings = bookings.filter(b => 
                            b.hall && b.hall._id === hall._id && 
                            b.date === new Date().toISOString().split('T')[0]
                          ).length
                          return (
                            <TableRow key={hall._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{hall.name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="gap-1">
                                  <Users className="h-3 w-3" />
                                  {hall.capacity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={todayBookings > 4 ? "destructive" : todayBookings > 2 ? "default" : "secondary"}
                                  className="gap-1"
                                >
                                  {todayBookings > 4 ? (
                                    <XCircle className="h-3 w-3" />
                                  ) : todayBookings > 0 ? (
                                    <AlertCircle className="h-3 w-3" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  {todayBookings}/{TIME_SLOTS.length} slots
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => deleteHall(hall._id)}
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="faculty" className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Add New Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input 
                      placeholder="Full Name" 
                      value={newFaculty.name} 
                      onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})} 
                    />
                    <Input 
                      placeholder="Username" 
                      value={newFaculty.username} 
                      onChange={(e) => setNewFaculty({...newFaculty, username: e.target.value})} 
                    />
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        placeholder="Password" 
                        value={newFaculty.password} 
                        onChange={(e) => setNewFaculty({...newFaculty, password: e.target.value})} 
                        className="flex-1"
                      />
                      <Button onClick={addFaculty} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Plus className="h-4 w-4" />
                        Add Faculty
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Faculty Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Username</TableHead>
                          <TableHead className="font-semibold">Total Bookings</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faculty.map(f => {
                          const facultyBookings = bookings.filter(b => b.faculty && b.faculty._id === f._id).length
                          return (
                            <TableRow key={f._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{f.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {f.username}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {facultyBookings}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => deleteFaculty(f._id)}
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bookings">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      All Bookings
                    </CardTitle>
                    <Button onClick={exportBookings} className="bg-green-600 hover:bg-green-700 gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Hall</TableHead>
                          <TableHead className="font-semibold">Faculty</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Time</TableHead>
                          <TableHead className="font-semibold">Purpose</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.filter(b => b.hall && b.faculty).map(b => (
                          <TableRow key={b._id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">{b.hall.name}</TableCell>
                            <TableCell>{b.faculty.name}</TableCell>
                            <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {b.timeSlot}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{b.purpose}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  Faculty Dashboard
                  {isConnected ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 animate-pulse">
                      <Wifi className="h-3 w-3 mr-1" />
                      Live Updates
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600 text-sm">Welcome back, {user.name}</p>
              </div>
            </div>
            <Button onClick={() => setUser(null)} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardTitle className="flex items-center gap-2 text-xl relative z-10">
              <CalendarDays className="h-6 w-6" />
              Book a Hall
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-white/90 font-medium">Select Hall</Label>
                <select 
                  className="w-full p-3 border-0 rounded-lg bg-white/90 text-gray-900 focus:bg-white focus:ring-2 focus:ring-white/50 transition-all" 
                  value={booking.hall} 
                  onChange={(e) => setBooking({...booking, hall: e.target.value})}
                >
                  <option value="">Choose a hall...</option>
                  {halls.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} (Capacity: {h.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium">Select Date</Label>
                <Input 
                  type="date" 
                  value={booking.date} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({...booking, date: e.target.value})} 
                  className="bg-white/90 border-0 focus:bg-white focus:ring-2 focus:ring-white/50 h-12 text-black"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium">Time Slot</Label>
                <select 
                  className="w-full p-3 border-0 rounded-lg bg-white/90 text-gray-900 focus:bg-white focus:ring-2 focus:ring-white/50 transition-all" 
                  value={booking.timeSlot} 
                  onChange={(e) => setBooking({...booking, timeSlot: e.target.value})}
                >
                  <option value="">Select time...</option>
                  {TIME_SLOTS.map(slot => {
                    const isBooked = booking.hall && booking.date && 
                      isSlotBooked(booking.hall, booking.date, slot)
                    return (
                      <option key={slot} value={slot} disabled={isBooked}>
                        {slot} {isBooked ? '(Booked)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium">Purpose</Label>
                <Input 
                  placeholder="e.g., Faculty Meeting, Seminar" 
                  value={booking.purpose} 
                  onChange={(e) => setBooking({...booking, purpose: e.target.value})} 
                  className="bg-white/90 border-0 focus:bg-white focus:ring-2 focus:ring-white/50 h-12"
                />
              </div>
            </div>
            <Button 
              onClick={bookHall} 
              className="mt-6 bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={(() => {
                if (!booking.date) return false
                const myBookingsToday = bookings.filter(b => 
                  b.faculty && b.faculty._id === user.id && b.date === booking.date
                ).length
                return myBookingsToday >= 2
              })()
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {(() => {
                if (!booking.date) return "Book This Hall"
                const myBookingsToday = bookings.filter(b => 
                  b.faculty && b.faculty._id === user.id && b.date === booking.date
                ).length
                if (myBookingsToday >= 2) return "Daily Limit Reached (2/2)"
                return `Book This Hall (${myBookingsToday}/2 today)`
              })()
              }
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-blue-600" />
                Hall Availability
                {isConnected && (
                  <Badge className="bg-green-500 text-white border-0 text-xs animate-pulse">
                    Real-time
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Date:</Label>
                <Input 
                  type="date" 
                  value={selectedDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {halls.map(hall => (
              <div key={hall._id} className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    {hall.name}
                  </h3>
                  <Badge variant="secondary" className="gap-1 px-3 py-1">
                    <Users className="h-3 w-3" />
                    {hall.capacity} seats
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {TIME_SLOTS.map(slot => {
                    const booked = getBookingForSlot(hall._id, selectedDate, slot)
                    const isMyBooking = booked?.faculty?._id === user.id
                    const slotKey = `${hall._id}-${selectedDate}-${slot}`
                    const isRecentlyUpdated = recentlyUpdated.has(slotKey)
                    
                    return (
                      <div 
                        key={slot} 
                        className={`relative p-4 text-center rounded-xl text-sm border-2 transition-all duration-300 transform hover:scale-105 ${
                          booked 
                            ? isMyBooking 
                              ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 text-blue-900 shadow-lg' 
                              : 'bg-gradient-to-br from-red-100 to-red-200 border-red-400 text-red-900'
                            : 'bg-gradient-to-br from-green-100 to-green-200 border-green-400 text-green-900 hover:from-green-200 hover:to-green-300 cursor-pointer'
                        } ${
                          isRecentlyUpdated ? 'animate-pulse ring-4 ring-yellow-400 ring-opacity-75' : ''
                        }`}
                      >
                        {isRecentlyUpdated && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                        )}
                        <div className="font-bold text-base">{slot}</div>
                        {booked ? (
                          <div className="mt-2">
                            {isMyBooking ? (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-7 text-xs px-3 shadow-md hover:shadow-lg transition-all" 
                                onClick={() => cancelBooking(booked._id)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            ) : (
                              <div className="text-xs leading-tight">
                                <div className="font-medium">Booked</div>
                                <div className="text-xs opacity-75">{booked.faculty?.name || 'Unknown'}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center justify-center gap-1 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs font-medium">Available</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              My Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.filter(b => b.faculty && b.faculty._id === user.id).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No bookings found</p>
                <p className="text-gray-400 text-sm mt-1">Your future bookings will appear here</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Hall</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Time</TableHead>
                      <TableHead className="font-semibold">Purpose</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings
                      .filter(b => b.faculty && b.faculty._id === user.id && b.hall)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(b => {
                        const isUpcoming = new Date(b.date) >= new Date().setHours(0,0,0,0)
                        return (
                          <TableRow key={b._id} className={`hover:bg-gray-50 transition-colors ${
                            isUpcoming ? '' : 'opacity-60'
                          }`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                {b.hall.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">
                                    {new Date(b.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  {!isUpcoming && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5">Past</Badge>
                                  )}
                                  {isUpcoming && new Date(b.date).toDateString() === new Date().toDateString() && (
                                    <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 animate-pulse">Today</Badge>
                                  )}
                                  {isUpcoming && new Date(b.date).toDateString() === new Date(Date.now() + 86400000).toDateString() && (
                                    <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">Tomorrow</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(() => {
                                    const today = new Date()
                                    const bookingDate = new Date(b.date)
                                    const diffTime = bookingDate - today
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                    
                                    if (diffDays < 0) {
                                      return `${Math.abs(diffDays)} days ago`
                                    } else if (diffDays === 0) {
                                      return 'Today'
                                    } else if (diffDays === 1) {
                                      return 'Tomorrow'
                                    } else if (diffDays <= 7) {
                                      return `In ${diffDays} days`
                                    } else {
                                      return `In ${Math.ceil(diffDays / 7)} weeks`
                                    }
                                  })()
                                  }
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {b.timeSlot}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={b.purpose}>{b.purpose}</div>
                            </TableCell>
                            <TableCell>
                              {isUpcoming ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => cancelBooking(b._id)}
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Cancel
                                </Button>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Completed</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    }
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
