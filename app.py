from flask import Flask, render_template, request, abort
from data import get_commitments, get_commitment, get_metadata, get_stats, get_all_categories

app = Flask(__name__)


@app.route("/")
def index():
    all_commitments = get_commitments()
    stats = get_stats(all_commitments)
    meta = get_metadata()
    recent = all_commitments[:3]
    return render_template("index.html", stats=stats, meta=meta, recent=recent,
                           all_commitments=all_commitments)


@app.route("/projects")
def projects():
    category = request.args.get("category", "All")
    status = request.args.get("status", "All")
    all_commitments = get_commitments()
    filtered = get_commitments(
        category=None if category == "All" else category,
        status=None if status == "All" else status,
    )
    stats = get_stats(all_commitments)
    categories = get_all_categories()
    return render_template(
        "projects.html",
        commitments=filtered,
        stats=stats,
        categories=categories,
        active_category=category,
        active_status=status,
    )


@app.route("/detail/<commitment_id>")
def detail(commitment_id):
    item = get_commitment(commitment_id)
    if not item:
        abort(404)
    all_commitments = get_commitments()
    related = [c for c in all_commitments
               if c["category"] == item["category"] and c["id"] != item["id"]]
    return render_template("detail.html", item=item, related=related)


@app.route("/timeline")
def timeline():
    all_commitments = get_commitments()
    by_category = {}
    for c in all_commitments:
        by_category.setdefault(c["category"], []).append(c)
    return render_template("timeline.html", by_category=by_category)


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def server_error(e):
    return render_template("500.html", error=str(e)), 500


if __name__ == "__main__":
    app.run(debug=True)
