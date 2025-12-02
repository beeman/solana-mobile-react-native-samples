import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { AppConfig } from '@/constants/app-config'
import { Cluster } from './cluster'

const CLUSTER_STORAGE_KEY = 'selected-cluster'

export interface ClusterProviderState {
  selectedCluster: Cluster
  clusters: Cluster[]
  setCluster: (cluster: Cluster) => void
}

const ClusterContext = createContext<ClusterProviderState>({} as ClusterProviderState)

export function ClusterProvider({ children }: PropsWithChildren) {
  const [selectedCluster, setSelectedCluster] = useState<Cluster>(AppConfig.clusters[0])

  useEffect(() => {
    // Load saved cluster from storage
    AsyncStorage.getItem(CLUSTER_STORAGE_KEY).then((stored) => {
      if (stored) {
        const cluster = AppConfig.clusters.find((c) => c.id === stored)
        if (cluster) {
          setSelectedCluster(cluster)
        }
      }
    })
  }, [])

  const setCluster = (cluster: Cluster) => {
    setSelectedCluster(cluster)
    AsyncStorage.setItem(CLUSTER_STORAGE_KEY, cluster.id)
  }

  return (
    <ClusterContext.Provider
      value={{
        selectedCluster,
        clusters: AppConfig.clusters,
        setCluster,
      }}
    >
      {children}
    </ClusterContext.Provider>
  )
}

export function useCluster(): ClusterProviderState {
  return useContext(ClusterContext)
}
