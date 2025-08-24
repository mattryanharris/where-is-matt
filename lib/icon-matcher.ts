export interface IconMatch {
  iconPath: string | null
  iconName: string | null
}

export function getIconForMessage(message: string): IconMatch {
  // Check for exact keywords (case-sensitive)
  if (message.includes("Coffee")) {
    return {
      iconPath: "/images/coffee.webp",
      iconName: "coffee",
    }
  }

  if (message.includes("Walking")) {
    return {
      iconPath: "/images/walk.webp",
      iconName: "walk",
    }
  }

  if (message.includes("On Train")) {
    return {
      iconPath: "/images/train.webp",
      iconName: "train",
    }
  }

  if (message.includes("Home")) {
    return {
      iconPath: "/images/home.webp",
      iconName: "home",
    }
  }

  if (message.includes("Office")) {
    return {
      iconPath: "/images/work.webp",
      iconName: "work",
    }
  }

  return {
    iconPath: null,
    iconName: null,
  }
}
