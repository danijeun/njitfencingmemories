export const REACTION_EMOJIS = ["❤️"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
export const HEART: ReactionEmoji = "❤️";
