import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "@/components/ui/Image";

const ROOMS = [
  { id: "bedroom", file: "bedroom.png", label: "Chambre" },
  { id: "industrial", file: "industrial.png", label: "Industriel" },
  { id: "modern", file: "modern.png", label: "Moderne" },
  { id: "parisian", file: "parisian.png", label: "Parisien" },
  { id: "scandinavian", file: "scandinavian.png", label: "Scandinave" },
] as const;

type RoomId = (typeof ROOMS)[number]["id"];

/** Position du centre du cadre et échelle de la scène (pour mise à l'échelle réelle). Fallback maxWidth/maxHeight si pas de dimensions cm. */
const ROOM_FRAME_CONFIG: Record<
  RoomId,
  {
    centerX: number;
    centerY: number;
    /** Largeur visible de la scène en cm (calibrée par pièce). Utilisée pour scale réelle. */
    referenceSceneWidthCm: number;
    maxWidth: number;
    maxHeight: number;
  }
> = {
  bedroom: { centerX: 49, centerY: 30, referenceSceneWidthCm: 400, maxWidth: 44, maxHeight: 30 },
  industrial: { centerX: 50, centerY: 46, referenceSceneWidthCm: 350, maxWidth: 28, maxHeight: 36 },
  modern: { centerX: 51, centerY: 39, referenceSceneWidthCm: 450, maxWidth: 38, maxHeight: 26 },
  parisian: { centerX: 51, centerY: 43, referenceSceneWidthCm: 350, maxWidth: 42, maxHeight: 28 },
  scandinavian: { centerX: 55, centerY: 28, referenceSceneWidthCm: 420, maxWidth: 44, maxHeight: 28 },
};

const MAX_WIDTH_PCT = 90;

/** Ombre réaliste bas/droite (lumière depuis la gauche), très discrète. */
const FRAME_SHADOW = "2px 2px 4px rgba(0,0,0,0.15)";

function getFrameDimensions(
  aspectRatio: number,
  maxWidthPct: number,
  maxHeightPct: number
): { widthPct: number; heightPct: number } {
  const widthFromHeight = maxHeightPct * aspectRatio;
  const heightFromWidth = maxWidthPct / aspectRatio;
  if (widthFromHeight <= maxWidthPct) {
    return { widthPct: widthFromHeight, heightPct: maxHeightPct };
  }
  return { widthPct: maxWidthPct, heightPct: heightFromWidth };
}

export { ROOMS };

interface InSituTemplateProps {
  paintingImageUrl: string;
  imageWidth: number;
  imageHeight: number;
  /** Dimensions réelles en cm pour mise à l'échelle dans la pièce. Si absentes, fallback sur maxWidth/maxHeight. */
  realWidthCm?: number;
  realHeightCm?: number;
  /** Mode grande zone (colonne gauche lightbox) : pas de wrapper, pas de sélecteur intégré. */
  large?: boolean;
  /** Pièce sélectionnée (requis en mode large, le sélecteur est dans la colonne droite). */
  selectedRoomId?: string;
  onRoomChange?: (roomId: string) => void;
}

export default function InSituTemplate({
  paintingImageUrl,
  imageWidth,
  imageHeight,
  realWidthCm,
  realHeightCm,
  large = false,
  selectedRoomId: controlledRoomId,
  onRoomChange,
}: InSituTemplateProps) {
  const [internalRoomId, setInternalRoomId] = useState<string>(ROOMS[0].id);
  const selectedRoomId = large && controlledRoomId != null ? controlledRoomId : internalRoomId;
  const setSelectedRoomId = large && onRoomChange ? onRoomChange : setInternalRoomId;

  const selectedRoom = ROOMS.find((r) => r.id === selectedRoomId) ?? ROOMS[0];
  const roomSrc = `${import.meta.env.BASE_URL}images/in-situ/${selectedRoom.file}`;

  const config = ROOM_FRAME_CONFIG[selectedRoom.id as RoomId] ?? ROOM_FRAME_CONFIG.bedroom;
  const aspectRatio = imageWidth / imageHeight;

  const useRealScale =
    realWidthCm != null &&
    realHeightCm != null &&
    realWidthCm > 0 &&
    realHeightCm > 0;

  const frameStyle = useMemo(() => {
    if (useRealScale) {
      const widthPct = Math.min(
        (realWidthCm! / config.referenceSceneWidthCm) * 100,
        MAX_WIDTH_PCT
      );
      return {
        left: `${config.centerX}%`,
        top: `${config.centerY}%`,
        width: `${widthPct}%`,
        aspectRatio: `${realWidthCm!} / ${realHeightCm!}`,
        transform: "translate(-50%, -50%)",
        boxShadow: FRAME_SHADOW,
      } as const;
    }
    const { widthPct, heightPct } = getFrameDimensions(
      aspectRatio,
      config.maxWidth,
      config.maxHeight
    );
    return {
      left: `${config.centerX - widthPct / 2}%`,
      top: `${config.centerY - heightPct / 2}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      boxShadow: FRAME_SHADOW,
    } as const;
  }, [
    useRealScale,
    realWidthCm,
    realHeightCm,
    config.centerX,
    config.centerY,
    config.referenceSceneWidthCm,
    config.maxWidth,
    config.maxHeight,
    aspectRatio,
  ]);

  const roomContent = (
    <div
      className={`relative overflow-hidden bg-gray-200 ${large ? "w-full h-full min-h-0" : "aspect-video rounded-sm"}`}
    >
      <img
        src={roomSrc}
        alt={selectedRoom.label}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute overflow-hidden bg-white"
        style={frameStyle}
      >
        <Image
          src={paintingImageUrl}
          alt="Œuvre in situ"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );

  if (large) {
    return roomContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-6 bg-gray-50 rounded-sm"
    >
      <p className="text-sm text-gray-medium mb-3">
        Visualisation de l'œuvre dans un intérieur fictif
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ROOMS.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => setSelectedRoomId(room.id)}
            className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              selectedRoomId === room.id
                ? "bg-foreground text-white"
                : "bg-gray-200 text-foreground hover:bg-gray-300"
            }`}
          >
            {room.label}
          </button>
        ))}
      </div>
      {roomContent}
    </motion.div>
  );
}
