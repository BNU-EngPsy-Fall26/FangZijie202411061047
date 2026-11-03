import bpy, math, random
from mathutils import Vector
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.38):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF'); s.inputs['Base Color'].default_value=(*color,1); s.inputs['Metallic'].default_value=metal;s.inputs['Roughness'].default_value=rough
    return m
mint=mat('pistachio meadow',(.49,.79,.66));lav=mat('lavender satellite',(.61,.52,.83));cream=mat('vanilla suit',(.97,.91,.79));white=mat('porcelain',(.98,.98,1));pink=mat('strawberry',(.94,.48,.62));dark=mat('espresso face',(.14,.16,.24));blue=mat('midnight visor',(.16,.24,.33),.15,.21);gold=mat('apricot brass',(.99,.69,.29),.22);teal=mat('seafoam',(.22,.62,.57));brown=mat('biscuit box',(.78,.56,.34));ribbon=mat('parcel ribbon',(.97,.81,.48))
def finish(o,name,material):
    o.name=name;o.data.materials.append(material)
    if o.type=='MESH':
        for f in o.data.polygons:f.use_smooth=True
    return o
def uv(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,material)
def ico(name,loc,scale,material):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,material)
def cube(name,loc,scale,material,bevel=.12):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('soft toy edges','BEVEL');mod.width=bevel;mod.segments=3
        o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
    return finish(o,name,material)
def cyl(name,loc,radius,depth,material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc);o=bpy.context.object
    mod=o.modifiers.new('rounded edge','BEVEL');mod.width=.1;mod.segments=3
    return finish(o,name,material)
def torus(name,loc,major,minor,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,location=loc,major_radius=major,minor_radius=minor,rotation=rotation);return finish(bpy.context.object,name,material)
def star(name,loc,radius,material,rot=0):
    verts=[]
    for y in [-.07,.07]:
        for i in range(10):
            a=rot+i*math.pi/5;r=radius if i%2==0 else radius*.47;verts.append((loc[0]+math.sin(a)*r,loc[1]+y,loc[2]+math.cos(a)*r))
    faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,material)
    mod=o.modifiers.new('soft star','BEVEL');mod.width=.04;mod.segments=2
    return o

# A compact floating toy diorama. Front is -Y; Blender Z becomes glTF Y.
cyl('floating lavender pedestal',(0,0,-.23),2.3,.5,lav)
cyl('mint island top',(0,0,.035),2.23,.19,mint)
torus('cream island rim',(0,0,-.01),2.24,.055,cream)
for i in range(9):
    a=i*math.tau/9;ico('floating underside pebble',(math.cos(a)*1.55,math.sin(a)*1.55,-.43),(.42,.42,.29),lav)

# Bunny astronaut, big head and tiny body.
uv('astronaut torso',(-.45,-.12,.92),(.48,.38,.63),cream)
cube('life support backpack',(-.45,.23,1.08),(.69,.34,.77),teal,.16)
for x in [-.76,-.15]:
    uv('little boot',(x,-.27,.36),(.24,.36,.19),white)
uv('left glove',(-1.02,-.14,.97),(.20,.22,.24),white)
uv('right glove',(.10,-.30,1.08),(.19,.20,.23),white)
o=uv('left arm',(-.89,-.03,1.1),(.17,.21,.35),cream);o.rotation_euler[1]=-.5
o=uv('right arm',(-.03,-.07,1.17),(.17,.2,.32),cream);o.rotation_euler[1]=.6
uv('helmet shell',(-.45,-.10,1.91),(.79,.65,.72),white)
uv('visor dark gasket',(-.45,-.613,1.9),(.65,.19,.53),blue)
uv('bunny face',(-.45,-.745,1.92),(.55,.105,.43),cream)
for x in [-.65,-.25]:
    uv('shiny black eye',(x,-.842,1.99),(.045,.026,.067),dark)
    uv('eye sparkle',(x-.012,-.867,2.016),(.014,.009,.018),white)
for x in [-.82,-.08]: uv('rosy cheek',(x,-.821,1.86),(.073,.018,.046),pink)
uv('button bunny nose',(-.45,-.86,1.875),(.042,.019,.032),pink)
for x,angle in [(-.84,-.13),(-.1,.13)]:
    o=uv('long bunny ear',(x,-.03,2.68),(.19,.20,.60),white);o.rotation_euler[1]=angle
    o=uv('pink ear inset',(x,-.202,2.72),(.102,.027,.43),pink);o.rotation_euler[1]=angle
for x in [-1.19,.29]:uv('helmet ear port',(x,-.04,1.91),(.1,.23,.23),gold)
cube('chest control panel',(-.45,-.477,1.10),(.44,.07,.32),lav,.055)
for x,m in [(-.56,gold),(-.36,teal)]:uv('panel button',(x,-.525,1.13),(.045,.025,.045),m)
star('suit badge',(-.45,-.53,.98),.065,gold)

# Parcel on a tiny dolly.
cube('parcel',(0.84,-.67,.58),(.66,.63,.62),brown,.06)
cube('parcel wrapping horizontal',(0.84,-.67,.58),(.69,.12,.65),ribbon,.025)
cube('parcel wrapping vertical',(0.84,-.67,.58),(.12,.66,.65),ribbon,.025)
cube('address label',(1.0,-1.0,.65),(.20,.016,.14),cream,.015)
star('parcel tiny stamp',(.76,-1.015,.65),.07,pink)

# Pastel rocket at rear right.
rx,ry=1.15,.61
uv('rocket capsule',(rx,ry,1.01),(.36,.36,.77),white)
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.34,radius2=.02,depth=.58,location=(rx,ry,1.72));finish(bpy.context.object,'apricot rocket nose',pink)
torus('porthole rim',(rx,ry-.33,1.16),.17,.045,gold,(math.pi/2,0,0))
uv('porthole glass',(rx,ry-.35,1.16),(.15,.045,.15),blue)
for dx in [-.34,.34]:
    o=uv('rocket fin',(rx+dx,ry,.59),(.12,.22,.36),teal);o.rotation_euler[1]=-.4 if dx<0 else .4
uv('rocket flame',(rx,ry,.28),(.17,.17,.30),gold)

# A moon garden, stepping stones and little signal beacon.
for loc in [(-1.5,.67,.2),(-1.77,.31,.2),(.4,1.5,.2)]:
    uv('moon mushroom stalk',loc,(.065,.065,.19),cream);uv('moon mushroom cap',(loc[0],loc[1],loc[2]+.16),(.19,.19,.11),pink)
for x,y in [(-.7,-1.38),(-.2,-1.56),(.3,-1.45)]:uv('stepping stone',(x,y,.15),(.21,.16,.045),cream)
for x,y,z,r in [(-1.5,.5,2.4,.25),(1.95,-.5,2.15,.22),(.8,.6,2.85,.18)]:star('floating golden star',(x,y,z),r,gold,.18)
torus('planet orbit',(0,0,.10),2.65,.025,gold,(.18,.08,0))
uv('orbit satellite',(2.5,.78,.23),(.12,.12,.12),pink)

world=bpy.context.scene.world;world.color=(.75,.8,.85)
bpy.ops.object.light_add(type='AREA',location=(-3,-4,7));bpy.context.object.data.energy=700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(4,1,5));bpy.context.object.data.energy=450;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(5,-8,5));cam=bpy.context.object;direction=Vector((0,0,1.0))-cam.location;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=7.8;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-source'/'starparcel.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'dist'/'assets'/'scene.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_apply=True)
print('ASSET_EXPORT_OK', (ROOT/'dist'/'assets'/'scene.glb').stat().st_size)
