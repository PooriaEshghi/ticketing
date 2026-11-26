import axios from 'axios';

const buildClient = ({ req }) => {
  if (typeof window === 'undefined') {
    return axios.create({
      baseURL:
        process.env.INTERNAL_API_URL ||
        'http://nginx-ingress-ingress-nginx-controller.ingress-nginx.svc.cluster.local',
      headers: req?.headers || {},
    });
  }

  return axios.create({
    baseURL: '/',
  });
};

export default buildClient;
