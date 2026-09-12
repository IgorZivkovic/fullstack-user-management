<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListUsersRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    /**
     * List users.
     *
     * Returns Laravel pagination metadata. Results can be searched by name or country and filtered by gender.
     */
    public function index(ListUsersRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 10);
        $search = trim($filters['search'] ?? '');
        $gender = $filters['gender'] ?? null;

        $users = User::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('country', "%{$search}%");
                });
            })
            ->when($gender !== null, fn (Builder $query) => $query->where('gender', $gender))
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return UserResource::collection($users);
    }

    /**
     * Get a user.
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    /**
     * Create a user.
     *
     * Requires an administrator account.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Update a user.
     *
     * Requires an administrator account. Only supplied fields are changed.
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return new UserResource($user->refresh());
    }

    /**
     * Delete a user.
     *
     * Requires an administrator account.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['deleted' => true]);
    }
}
