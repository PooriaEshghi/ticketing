import axios from 'axios';

const buildClient = ({ req }) => {
  if (typeof window === 'undefined') {
    // 🌐 Server-side: Request from inside Kubernetes cluster
    return axios.create({
      baseURL: process.env.INTERNAL_API_URL || 'http://nginx-ingress-ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      headers: req?.headers || {}, // Ensure headers exist
    });
  } else {
    // 🌍 Client-side: Use relative base URL
    return axios.create({
      baseURL: '/',
    });
  }
};

export default buildClient;
