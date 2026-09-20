import React from 'react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || 'QUEUED').toUpperCase();

  const getBadgeClass = () => {
    switch (normalizedStatus) {
      case 'SUCCESS':
        return 'badge-success';
      case 'FAILED':
        return 'badge-failed';
      case 'BUILDING':
        return 'badge-building';
      case 'DEPLOYING':
        return 'badge-deploying';
      case 'ROLLED_BACK':
        return 'badge-rolled_back';
      case 'QUEUED':
      default:
        return 'badge-queued';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      <span className="badge-dot"></span>
      {normalizedStatus}
    </span>
  );
};

export default StatusBadge;

