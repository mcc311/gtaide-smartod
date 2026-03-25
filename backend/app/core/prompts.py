"""Shared Jinja2 prompt template loader."""

from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "prompts"

_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    keep_trailing_newline=False,
    trim_blocks=True,
    lstrip_blocks=True,
)


def render(template_name: str, **kwargs) -> str:
    """Render a prompt template with given variables."""
    template = _env.get_template(template_name)
    return template.render(**kwargs).strip()
