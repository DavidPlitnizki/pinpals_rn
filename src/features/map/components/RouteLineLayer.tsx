import { LineLayer, ShapeSource } from '@rnmapbox/maps';
import React from 'react';

import { ROUTE_LINE_COLOR, ROUTE_LINE_WIDTH } from '../constants';

interface Props {
  geometry: GeoJSON.LineString;
}

export function RouteLineLayer({ geometry }: Props) {
  return (
    <ShapeSource id="route-source" shape={geometry}>
      <LineLayer
        id="route-line"
        style={{
          lineColor: ROUTE_LINE_COLOR,
          lineWidth: ROUTE_LINE_WIDTH,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </ShapeSource>
  );
}
