export const MapContainer = ({ children, ...props }) => (
  <div data-testid="map-container" {...props}>
    {children}
  </div>
);

export const TileLayer = () => null;
export const Marker = ({ children }) => <div>{children}</div>;
export const Popup = ({ children }) => <div>{children}</div>;

export const useMapEvents = () => null;
