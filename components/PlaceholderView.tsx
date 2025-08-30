/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface PlaceholderViewProps {
  title: string;
  description?: string;
}

const PlaceholderView = ({ title, description = 'This feature is coming soon!' }: PlaceholderViewProps) => {
  return (
    <div className="placeholder-view">
      <h1 className="placeholder-view-title">{title}</h1>
      <p className="placeholder-view-description">{description}</p>
    </div>
  );
};

export default PlaceholderView;
