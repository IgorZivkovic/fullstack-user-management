<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    private const USER_FIELDS = ['name', 'birthday', 'gender', 'country'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(100, max(1, $request->integer('per_page', 10)));
        $search = trim($request->string('search')->toString());
        $gender = trim($request->string('gender')->toString());

        $users = User::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('country', "%{$search}%");
                });
            })
            ->when($gender !== '', fn (Builder $query) => $query->where('gender', $gender))
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function store(Request $request): JsonResponse
    {
        $user = User::query()->create($request->only(self::USER_FIELDS));

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(Request $request, User $user): UserResource
    {
        $user->update($request->only(self::USER_FIELDS));

        return new UserResource($user->refresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['deleted' => true]);
    }
}
