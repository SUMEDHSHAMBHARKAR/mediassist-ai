from jinja2 import Environment , FileSystemLoader


loader = FileSystemLoader(["app/email/templates"])
env =  Environment(loader=loader)

def render_template(template_name: str,context: dict) -> str:
    template = env.get_template(template_name)
    
    return template.render(**context)


