import AssetFrame from "./asset-frame";
import AssetImage from "./asset-image";
import AssetVideo from "./asset-video";
import type { AssetProps } from "./asset-types";

function AssetMedia(props: AssetProps) {
  switch (props.type) {
    case "video":
      return <AssetVideo {...props} />;
    default:
      return <AssetImage {...props} />;
  }
}

export function Asset(props: AssetProps) {
  return (
    <AssetFrame
      width={props.width}
      height={props.height}
      className={props.className}
    >
      <AssetMedia {...props} />
    </AssetFrame>
  );
}

export default Asset;
