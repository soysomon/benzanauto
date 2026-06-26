import { User } from '../models/User.js'
import { Vehicle } from '../models/Vehicle.js'
import { serializeAdminVehicle } from './vehicle.service.js'

export async function getDashboardStats() {
  const [
    totalVehicles,
    publishedVehicles,
    draftVehicles,
    soldVehicles,
    archivedVehicles,
    featuredVehicles,
    activeAdminUsers,
    totalsAggregate,
    recentVehicles,
    topViewedVehicles,
    topContactedVehicles,
    rolesAggregate,
  ] = await Promise.all([
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: 'published' }),
    Vehicle.countDocuments({ status: 'draft' }),
    Vehicle.countDocuments({ status: 'sold' }),
    Vehicle.countDocuments({ status: 'archived' }),
    Vehicle.countDocuments({ featured: true }),
    User.countDocuments({ isActive: true }),
    Vehicle.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalContacts: { $sum: '$contactCount' },
        },
      },
    ]),
    Vehicle.find().sort({ createdAt: -1 }).limit(5),
    Vehicle.find({ views: { $gt: 0 } }).sort({ views: -1, createdAt: -1 }).limit(5),
    Vehicle.find({ contactCount: { $gt: 0 } }).sort({ contactCount: -1, createdAt: -1 }).limit(5),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
  ])

  const totals = totalsAggregate[0] ?? { totalViews: 0, totalContacts: 0 }

  return {
    counts: {
      totalVehicles,
      publishedVehicles,
      draftVehicles,
      soldVehicles,
      archivedVehicles,
      featuredVehicles,
      totalViews: totals.totalViews,
      totalContacts: totals.totalContacts,
      activeAdminUsers,
    },
    recentVehicles: recentVehicles.map((vehicle) => serializeAdminVehicle(vehicle)),
    topViewedVehicles: topViewedVehicles.map((vehicle) => serializeAdminVehicle(vehicle)),
    topContactedVehicles: topContactedVehicles.map((vehicle) => serializeAdminVehicle(vehicle)),
    usersByRole: {
      superadmin: 0,
      admin: 0,
      editor: 0,
      viewer: 0,
      ...Object.fromEntries(rolesAggregate.map((item) => [item._id, item.count])),
    },
  }
}

