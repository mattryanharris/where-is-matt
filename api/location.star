load("render.star", "render")

def main(ctx):
    return render.Root(
        child = render.Column(
            main_align="left",
            cross_align="left",
            children = [
                render.Text(
                    content = "Where's Matt?",
                    font = "5x8",
                    color = "#aaa",
                ),
                render.Box(height=2),
                render.Text(
                    content = "Test",
                    font = "6x13",
                    color = "#fff",
                ),
            ],
        ),
    )
