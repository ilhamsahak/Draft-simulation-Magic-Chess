export function getDraftSteps(type) {
  if (type === "6-ban") {
    return [
      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },

      { team: "A", action: "pick", count: 1 },
      { team: "B", action: "pick", count: 2 },
      { team: "A", action: "pick", count: 1 },

      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },
      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },

      { team: "A", action: "pick", count: 1 },
      { team: "B", action: "pick", count: 2 },
      { team: "A", action: "pick", count: 1 }
    ]
  }

  if (type === "8-ban") {
    return [
      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },
      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },

      { team: "A", action: "pick", count: 1 },
      { team: "B", action: "pick", count: 2 },
      { team: "A", action: "pick", count: 1 },

      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },
      { team: "A", action: "ban", count: 1 },
      { team: "B", action: "ban", count: 1 },

      { team: "A", action: "pick", count: 1 },
      { team: "B", action: "pick", count: 2 },
      { team: "A", action: "pick", count: 1 }
    ]
  }

  return []
}
